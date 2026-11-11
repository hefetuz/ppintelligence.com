/* oxlint-disable next/no-img-element -- Official self-hosted employer wordmarks. */
import { assetUrl } from '../asset-url';
const marks: Record<string,{file:string;width:number;height:number}> = {
  moodys:{file:'moodys.svg',width:166,height:34},
  chathamfinancial:{file:'chatham-financial.svg',width:286,height:72},
  breadfinancial:{file:'bread-financial.svg',width:667,height:96},
  tabapay:{file:'tabapay.png',width:240,height:122},
};
export function EmployerLogo({name}:{name:string}) {
 const key=name.toLowerCase().replace(/[^a-z]/g,'');const mark=marks[key];
 return mark ? <img className={'employer-logo employer-logo--'+key} src={assetUrl('assets/employers/'+mark.file)} alt={name} width={mark.width} height={mark.height} loading="lazy" decoding="async"/> : <span>{name}</span>;
}
