/** Deniz as a small Renaissance scholar sculpture; one ledger leaf answers the pointer. */
const { Cam, fit, proj, facing, rrect, circ, hull, poly, open, seg, clamp, rad, spring, stepS, mk, solid, put, prism, pointer, register, disposer } = HL;

function mount({ stage, svg, read }, value) {
  const bag=disposer(), C=Cam(45,.5,1.78), root=mk('g',{},svg);
  const W=(u,z,d=0)=>[(u+d)/Math.SQRT2,(-u+d)/Math.SQRT2,z];
  fit(C,[W(-43,0,-6),W(59,0,23),W(-32,143,0),W(54,102,20)],200,166);
  const P=proj(C), front=facing(C), Q=(u,z,d=0)=>P(...W(u,z,d));
  const path=(commands,depth=0)=>commands.map(([cmd,...p])=>cmd+p.reduce((a,v,i)=>i%2?a:[...a,Q(v,p[i+1],depth).map(n=>n.toFixed(2)).join(',')],[]).join(' ')).join(' ');
  const draw=(commands,depth=0,cls='sil',parent=root)=>mk('path',{d:path(commands,depth),class:cls},parent);
  const stroke=(commands,depth=0,parent=root)=>draw(commands,depth,'nf lo',parent);
  const body=mk('g',{},root);
  // Full gown: a quiet contrapposto and a rounded, asymmetric hem.
  draw([['M',-24,108],['C',-31,107,-33,98,-33,89],['C',-34,74,-28,68,-26,59],['C',-31,37,-34,19,-41,8],['Q',-44,3,-36,2],['Q',-25,-2,-16,3],['Q',-4,-1,5,3],['Q',17,-1,24,5],['Q',29,8,23,13],['C',10,32,14,51,5,69],['C',6,80,13,92,7,101],['Q',3,109,-6,110],['Z']],0,'sil',body);
  stroke([['M',-23,100],['C',-15,93,-6,90,3,99],['M',-26,72],['Q',-12,66,6,72],['M',-19,65],['C',-20,44,-29,23,-31,7],['M',-10,63],['C',-14,42,-12,21,-16,4],['M',-1,63],['C',-2,38,6,22,7,7],['M',6,51],['C',5,31,15,20,21,10]],.5,body);
  // Wide academic sleeves and the folded collar have their own opaque surfaces.
  draw([['M',-23,108],['C',-33,106,-39,96,-39,84],['Q',-37,76,-27,77],['Q',-17,80,-14,92],['L',-11,101],['Q',-16,105,-23,108],['Z']],3);
  stroke([['M',-30,102],['Q',-32,91,-34,84],['M',-24,99],['Q',-25,86,-28,81]],3.4);
  draw([['M',-21,109],['Q',-18,115,-16,115],['Q',-10,110,-3,115],['Q',3,112,5,106],['Q',-7,99,-12,98],['Q',-17,104,-21,109],['Z']],5);
  stroke([['M',-17,110],['Q',-12,104,-11,102],['Q',-6,105,1,109]],5.3);
  // Hair is a swept rounded mantle behind an individually drawn face.
  draw([['M',-25,125],['C',-27,138,-16,144,-7,141],['C',3,141,10,135,10,123],['C',9,108,14,98,10,88],['Q',5,83,-1,88],['Q',-4,91,-8,88],['Q',-17,83,-23,89],['C',-28,98,-27,111,-25,125],['Z']],4);
  stroke([['M',-13,139],['C',-23,129,-18,113,-24,98],['M',-18,137],['C',-28,123,-20,107,-26,94],['M',-7,139],['C',5,134,3,115,8,99],['M',-3,137],['C',8,125,3,111,10,92]],4.3);
  draw([['M',-18,132],['C',-13,138,-5,137,0,132],['C',4,127,2,122,4,119],['Q',7,117,2,116],['C',2,111,-3,108,-8,109],['C',-15,110,-18,116,-19,122],['Q',-20,128,-18,132],['Z']],6);
  stroke([['M',-15,127],['Q',-11,130,-7,127],['M',-3,127],['Q',0,129,2,126],['M',-6,126],['Q',-7,121,-4,119],['M',-11,115],['Q',-6,113,-2,115],['M',-14,124],['Q',-11,122,-8,124]],6.4);
  draw([['M',-13,139],['C',-21,135,-25,128,-24,117],['C',-26,105,-25,97,-21,91],['Q',-17,89,-15,92],['C',-23,104,-17,117,-18,126],['Q',-17,133,-13,139],['Z']],7);
  stroke([['M',-17,135],['C',-26,120,-19,107,-22,96],['M',-10,139],['C',-2,140,5,134,5,127],['C',3,114,10,103,6,94]],7.2);
  // Two softly rounded shoes peek from the academic gown.
  draw([['M',-26,5],['Q',-28,1,-25,-1],['L',-12,-1],['Q',-8,1,-12,4],['Z']],9);
  draw([['M',4,5],['Q',7,1,12,0],['L',22,0],['Q',27,2,23,4],['Q',13,7,4,5],['Z']],10);
  // A narrow isometric lectern is a single physical support, not a screen.
  const support=mk('g',{},root);
  draw([['M',30,72],['Q',33,74,36,72],['L',36,13],['Q',36,10,33,9],['Q',30,10,30,13],['Z']],15,'sil',support);
  stroke([['M',33,68],['L',33,15]],15.5,support);
  draw([['M',32,14],['Q',26,7,20,5],['Q',17,2,22,2],['Q',30,2,34,7],['Q',39,1,49,2],['Q',53,3,49,5],['Q',40,8,36,14],['Z']],16,'sil',support);
  const book=mk('g',{},root), B=(u,v,h=0)=>Q(25+u,78+v*.22+h,13+v);
  const bookRing=rrect(-22,-12,23,12,2.2,7), inset=rrect(-20,-10,21,10,1.4,7);
  const cover=mk('path',{d:poly(hull([...bookRing.map(q=>B(q.u,q.v,-1.6)),...bookRing.map(q=>B(q.u,q.v,0))])),class:'sil'},book);
  mk('path',{d:open(inset.slice(2,20).map(q=>B(q.u,q.v,0))),class:'nf lo'},book);
  const left=rrect(-20,-10,0,10,1.4,7), right=rrect(0,-10,21,10,1.4,7);
  mk('path',{d:poly(left.map(q=>B(q.u,q.v,1.1-Math.sin(q.u/20*Math.PI)*1.2))),class:'sil'},book);
  for(const v of [-6,-2,2,6]) mk('path',{d:seg(B(-17,v,1.5),B(-3,v,1.5)),class:'nf lo'},book);
  mk('path',{d:seg(B(-11,-8,1.5),B(-11,8,1.5)),class:'nf lo'},book);
  const page=mk('path',{class:'sil'},book), pageRules=mk('path',{class:'nf lo'},book), restSpine=mk('path',{d:seg(B(0,-9,1.3),B(0,9,1.3)),class:'nf hi'},book);
  // Sleeve and fingertips overlap the ledger's still left leaf, never its moving leaf.
  draw([['M',2,99],['Q',10,101,15,94],['L',19,85],['Q',14,79,8,80],['L',1,88],['Q',-3,94,2,99],['Z']],21);
  stroke([['M',6,96],['Q',8,87,15,84]],21.4);
  draw([['M',13,86],['Q',17,90,21,86],['L',26,81],['Q',28,79,26,78],['Q',25,78,22,81],['Q',27,76,24,76],['L',18,80],['Q',16,78,14,81],['Z']],23);
  // A feather and three milled coin rims make the academic/financial tools legible.
  const feather=draw([['M',-31,96],['C',-32,107,-37,113,-35,123],['C',-27,119,-25,109,-31,96],['Z']],11);
  stroke([['M',-31,96],['Q',-29,110,-35,123]],11.4);
  draw([['M',-31,98],['Q',-35,99,-35,95],['L',-33,91],['Q',-32,88,-29,90],['L',-25,94],['Q',-26,97,-31,98],['Z']],12);
  for(let i=0;i<3;i++) {
    const center=W(13+i*8,0,23+i*2), ring=circ(4.5,32).map(q=>({...q,u:q.u+center[0],v:q.v+center[1]})), inner=circ(3.4,32).map(q=>({...q,u:q.u+center[0],v:q.v+center[1]}));
    put(solid(root),prism(P,front,ring,inner,1,2.2+i*1.2));
  }
  let intensity=value, active=false, last=-1;
  const opening=spring(0), hitCenter=B(10,0,0);
  const loop=register(stage,dt=>{
    const moving=stepS(opening,dt);
    if(Math.abs(opening.x-last)>.0001){
      last=opening.x;
      const angle=rad(6+opening.x), F=(u,v)=>B(u*Math.cos(angle),v,1.2+u*Math.sin(angle));
      page.setAttribute('d',poly(right.map(q=>F(q.u,q.v))));
      pageRules.setAttribute('d',[-6,-2,2,6].map(v=>seg(F(3,v),F(18,v))).join('')+seg(F(11,-8),F(11,8)));
    }
    return moving;
  });
  bag.add(loop.unregister);
  function target(point){
    const dx=(point[0]-hitCenter[0])/50, dy=(point[1]-hitCenter[1])/32, distance=Math.hypot(dx,dy);
    active=distance<1.2;
    opening.t=active?intensity*clamp(1-distance/1.2,.15,1):0;
    page.classList.toggle('hi',active);restSpine.classList.toggle('hi',!active);
    read.textContent=active?'ledger':'rest';loop.wake();
  }
  bag.add(pointer(stage,{move:target,leave:()=>target([-1000,-1000])}));
  bag.add(()=>svg.replaceChildren());
  read.textContent='rest';loop.wake();
  return {set(v){intensity=v;if(active){opening.t=v;loop.wake();}},destroy:bag.dispose};
}

hairline({name:'deniz-scholar',means:'A Renaissance finance scholar; the pointer gently opens the ledger leaf beside her.',rules:[1,3,4,5,6,7,8,9,10],range:[8,18,28],mount});
