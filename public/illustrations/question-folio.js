const { Cam, clamp, disposer, facing, fit, mk, pointer, prism, proj, put,
  register, rings, seg, solid, tdone, tset, tval, tween, unproj } = HL;

// Three working papers in a slim folio. A fixed pick plane opens one paper;
// adjacent papers follow by distance, then return to their offset stack.
function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, .5, 1.9);
  fit(C, [[-52,-55,0],[52,55,0],[-52,55,42],[52,-55,42]], 200, 166);
  const P = proj(C), front = facing(C), root = mk('g', {}, svg);
  let reach = value, active = -1;
  const [cover, seam] = rings(-47,-52,47,52,.15,1.1);
  const backing = solid(root);
  put(backing, prism(P, front, cover, seam, 0, 3.5));
  // An actual binding seam, kept behind the loose papers.
  mk('path', {class:'nf lo',d:seg(P(-39,-44,3.6),P(-39,44,3.6))}, root);
  const specs = [
    {x:-4,y:-7,z:5}, {x:3,y:0,z:8}, {x:8,y:7,z:11},
  ];
  const papers = specs.map((s,i) => {
    const [ring, inner] = rings(-34+s.x,-43+s.y,34+s.x,43+s.y,.15,.7);
    const group = mk('g',{},root), body = solid(group);
    const marks = mk('path',{class:'nf lo'},group);
    const tabs = mk('path',{class:'nf'},group);
    return {...s,ring,inner,body,marks,tabs,lift:tween(0),last:NaN,i};
  });
  function draw(p, lift) {
    if (p.last === lift) return;
    p.last = lift;
    const z = p.z + lift;
    put(p.body,prism(P,front,p.ring,p.inner,z,z+.9));
    const line = (x0,y,x1) => seg(P(x0+p.x,y+p.y,z+1),P(x1+p.x,y+p.y,z+1));
    p.marks.setAttribute('d', line(-23,-29,5) + line(-23,-14,23)
      + line(-23,-6,17) + line(-23,9,23) + line(-23,17,10));
    // Short edge marks locate the sheets in the staggered paper stack.
    p.tabs.setAttribute('d',seg(P(25+p.x,-31+p.i*13+p.y,z+1),P(30+p.x,-31+p.i*13+p.y,z+1)));
  }
  function accent() { papers.forEach((p,i)=>p.body.sil.classList.toggle('hi',i===(active<0?2:active))); }
  papers.forEach(p=>draw(p,0)); accent(); read.textContent='rest';
  const loop=register(stage,(_dt,now)=>{
    let moving=false;
    papers.forEach(p=>{draw(p,tval(p.lift,now));moving ||= !tdone(p.lift,now);});
    return moving;
  });
  bag.add(loop.unregister);
  function choose(next) {
    if(next===active)return;
    const from=next<0?active:next, now=performance.now(); active=next;
    papers.forEach((p,i)=>tset(p.lift,next<0?0:reach*(i===next?1:.22/(1+Math.abs(i-next))),now,Math.abs(i-from)*40));
    accent();read.textContent=next<0?'rest':['Priorities','Constraints','Question'][next];loop.wake();
  }
  const aim=([sx,sy])=>{
    // Fixed resting plane: a lifted page cannot change the selection.
    const [x,y]=unproj(C,sx,sy,12);
    if(x < -43 || x > 47 || y < -50 || y > 54)return choose(-1);
    choose(clamp(Math.floor((y+43)/29),0,2));
  };
  bag.add(pointer(stage,{move:aim,down:aim,leave:()=>choose(-1)}));
  bag.add(()=>svg.replaceChildren());
  return {set:v=>{reach=clamp(v,8,24);if(active>=0){const a=active;active=-1;choose(a);}},destroy:bag.dispose};
}
hairline({
  name:'question-folio',
  means:'Three working papers lift from a bound folio, separating the question from its priorities and constraints.',
  rules:[1,2,3,4,5,6,7,8,9,10],range:[8,16,24],
  tour:[[200,115],[238,155],[195,192],null],mount,
});
