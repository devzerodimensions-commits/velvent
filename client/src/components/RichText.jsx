import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../store/content';
import { inr } from '../lib/format';

/**
 * Renders a line of admin-written copy.
 *
 * Two things are understood, and deliberately nothing else — no HTML is ever
 * parsed, so a stray angle bracket in the admin panel can only ever be a stray
 * angle bracket on the page:
 *
 *   [label](/path)   an internal link, or an external one for http(s)
 *   {returnDays}     a brand or shipping setting, formatted where it is money
 *
 * The tokens are what keep a policy page honest: the shipping section quotes
 * {fee}, so editing the fee under Brand & contact updates the sentence too.
 */

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** The values a token can stand for, built from the live brand settings. */
export function contentTokens(brand) {
  const s = brand?.shipping || {};
  return {
    name: brand?.name,
    phone: brand?.phone,
    email: brand?.email,
    hoursShort: brand?.hoursShort,
    hoursDays: brand?.hoursDays,
    freeAbove: s.freeAbove === undefined ? undefined : inr(s.freeAbove),
    fee: s.fee === undefined ? undefined : inr(s.fee),
    dispatchDays: s.dispatchDays,
    deliveryDays: s.deliveryDays,
    returnDays: s.returnDays,
  };
}

/** Replaces `{token}` with its value, leaving an unknown token untouched. */
export function fillTokens(text, tokens) {
  if (typeof text !== 'string') return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = tokens[key];
    return value === undefined || value === null ? match : String(value);
  });
}

function parse(text) {
  const out = [];
  let last = 0;
  let match;
  LINK.lastIndex = 0;
  while ((match = LINK.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    out.push({ label: match[1], to: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** One line of copy, inline — use inside a <p>, <li> or heading. */
export function Rich({ children, className = 'underline' }) {
  const brand = useContent('brand');
  if (typeof children !== 'string') return children ?? null;

  const filled = fillTokens(children, contentTokens(brand));
  return parse(filled).map((part, i) => (
    typeof part === 'string'
      ? <Fragment key={i}>{part}</Fragment>
      : /^https?:/i.test(part.to)
        ? <a key={i} href={part.to} target="_blank" rel="noreferrer noopener" className={className}>{part.label}</a>
        : <Link key={i} to={part.to} className={className}>{part.label}</Link>
  ));
}

/** A run of paragraphs from an array of strings. */
export default function RichText({ value, className = '', pClassName = '' }) {
  const lines = Array.isArray(value) ? value : [value];
  return (
    <div className={className}>
      {lines.filter(Boolean).map((line, i) => (
        <p key={i} className={pClassName}><Rich>{line}</Rich></p>
      ))}
    </div>
  );
}
