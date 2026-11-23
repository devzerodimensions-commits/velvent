import { Fragment } from 'react';
import { classFor, compile } from './style';
import { widgetDef } from './registry';

/**
 * The page renderer.
 *
 * There is exactly one of these and both the storefront and the editor canvas
 * use it. That is the whole point: a builder whose preview is a second
 * implementation of the real thing will drift from it, and the client only
 * finds out after publishing.
 *
 * The `ui` prop is how the editor adds its handles. Left out, this renders
 * clean markup with nothing of the editor in it.
 *
 * Note what the editor is NOT allowed to do: add elements to the flow. Drop
 * targets are handed to the wrappers as plain descriptions and drawn as
 * absolutely positioned overlays inside the element they belong to. An early
 * version put them in the flow as thin strips, and because a section's `gap`
 * applies between every flex child, two columns with a 24px gap showed 96px
 * of it in the editor. The canvas has to measure the same as the page.
 */

const NOOP_UI = {
  wrapSection: (_n, children) => children,
  wrapColumn: (_n, children) => children,
  wrapWidget: (_n, children) => children,
  DropZone: () => null,
  emptyColumn: () => null,
};

/* The palette the widgets' own defaults refer to, so a button with no colour
   set still looks like it belongs to this store. */
const BASE_CSS = `
.vb-page{--vb-ink:#2C3544;--vb-paper:#F6F2EA;--font-heading:Cinzel,'Trajan Pro',Georgia,serif;--font-body:Montserrat,ui-sans-serif,system-ui,sans-serif}
.vb-section{position:relative;width:100%}
.vb-row{display:flex;flex-wrap:wrap;margin:0 auto;width:100%;box-sizing:border-box}
.vb-col{display:flex;flex-direction:column;flex:1 1 0%;min-width:0;box-sizing:border-box}
.vb-widget{box-sizing:border-box}
.vb-prose p{margin:0 0 1em}
.vb-prose p:last-child{margin-bottom:0}
.vb-prose a{text-decoration:underline}
@media (max-width:767px){.vb-row{flex-direction:column}.vb-col{flex-basis:auto!important;max-width:100%!important}}
.vb-page[data-device="m"] .vb-row{flex-direction:column}
.vb-page[data-device="m"] .vb-col{flex-basis:auto!important;max-width:100%!important}
`;
/* The last two rules are the editor's copy of the media query above them.
   The canvas is narrowed by shrinking a wrapper, not the window, so a real
   media query never fires there — without these, columns that stack on a
   phone would stay side by side in the editor's Mobile view, and the client
   would publish a layout they had never actually seen. Live, the device is
   always "d", so only the media query applies. */

function Widget({ node, device, editing }) {
  const def = widgetDef(node.type);
  if (!def) {
    /* A page saved by a newer version of the editor, opened by an older one.
       Showing a gap beats throwing away markup the client cannot see is
       missing. Live, it renders nothing at all. */
    return editing
      ? <span className="block border border-dashed px-3 py-4 text-[12px] opacity-50">Unknown widget “{node.type}”</span>
      : null;
  }
  const Body = def.Render;
  return <Body settings={node.settings || {}} device={device} editing={editing} />;
}

export default function PageRender({
  doc,
  device = 'd',
  mode = 'live',
  ui = NOOP_UI,
  editing = false,
}) {
  const sections = doc?.sections || [];
  const css = compile(doc || { sections: [] }, { mode });

  return (
    <div className="vb-page" data-device={device}>
      <style>{BASE_CSS}{css}</style>

      {/* The one drop target that cannot hang off an element, because on an
          empty page there is no element to hang it off. */}
      {!sections.length && <ui.DropZone target={{ kind: 'section', index: 0 }} />}

      {sections.map((section, si) => (
        <Fragment key={section.id}>
          {ui.wrapSection(section, (
            <section className={`vb-section ${classFor(section.id)}`} data-vb-id={section.id}>
              <div className="vb-row">
                {(section.columns || []).map((column, ci) => (
                  <Fragment key={column.id}>
                    {ui.wrapColumn(column, (
                      <div className={`vb-col ${classFor(column.id)}`} data-vb-id={column.id}>
                        {(column.widgets || []).map((widget, wi) => (
                          <Fragment key={widget.id}>
                            {ui.wrapWidget(widget, (
                              <div className={`vb-widget ${classFor(widget.id)}`} data-vb-id={widget.id}>
                                <Widget node={widget} device={device} editing={editing} />
                              </div>
                            ), {
                              before: { kind: 'widget', columnId: column.id, index: wi },
                              after: { kind: 'widget', columnId: column.id, index: wi + 1 },
                            })}
                          </Fragment>
                        ))}

                        {!(column.widgets || []).length && ui.emptyColumn(column)}
                      </div>
                    ), {
                      before: { kind: 'column', sectionId: section.id, index: ci },
                      after: { kind: 'column', sectionId: section.id, index: ci + 1 },
                    })}
                  </Fragment>
                ))}
              </div>
            </section>
          ), {
            before: { kind: 'section', index: si },
            after: { kind: 'section', index: si + 1 },
          })}
        </Fragment>
      ))}
    </div>
  );
}
