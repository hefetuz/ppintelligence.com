/** URL-scoped artwork previews share the real homepage and its motion model. */
export type CoinIllustrationStyle = 'anatomy' | 'hairline' | 'combo';

export function coinInstrumentFill(search:string):'solid'|'outline' {
  return new URLSearchParams(search).get('coin-fill')==='solid'?'solid':'outline';
}

export function coinIllustrationStyle(search: string): CoinIllustrationStyle {
  const value = new URLSearchParams(search).get('coin-style');
  return value === 'hairline' || value === 'combo' ? value : 'anatomy';
}

export function coinIllustrationPaths(style: CoinIllustrationStyle) {
  return style === 'anatomy'
    ? {calibre: 'illustrations/penny-calibre', watch: 'experiments/clockwork-isometric'}
    : {calibre: `illustrations/coin-styles/${style}/calibre`, watch: `illustrations/coin-styles/${style}/watch`};
}

/** The document's base tag must not drop the selected drawing on local links. */
export function coinIllustrationPreviewHref(href: string, currentHref: string, baseHref: string) {
  const current=new URL(currentHref);
  if(!current.searchParams.has('coin-style')&&!current.searchParams.has('coin-fill'))return href;
  const target=new URL(href,baseHref);
  if(target.origin!==current.origin||target.pathname!==current.pathname)return href;
  for(const [key,value] of current.searchParams){
    if(!target.searchParams.has(key))target.searchParams.set(key,value);
  }
  return target.href;
}
