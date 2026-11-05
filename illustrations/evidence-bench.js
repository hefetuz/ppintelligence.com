const { Cam, circ, clamp, disposer, facing, fit, mk, pointer, poly, prism,
  proj, put, register, ringAt, rings, seg, solid, spring, stepS, unproj } = HL;

// A physical inspection lens travels across a pair of evidence sheets.
// The open centre is a real hole: the ruled paper stays visible underneath.
function mount({stage,svg,read},value) {
  const bag=disposer(), C=Cam(45,.5,1.9);
  fit(C,[[-58,-48,0],[58,48,0],[-58,48,36],[74,12,36]],200,166);
  const P=proj(C),front=facing(C),root=mk('g',{},svg);
  let reach=value,last=NaN,lastReach=NaN;
  const travel=spring(.36);
  const block=(x0,y0,x1,y1,z0,z1,r=.15)=>{
    const [ring,inner]=rings(x0,y0,x1,y1,r,.7),el=solid(root);
    put(el,prism(P,front,ring,inner,z0,z1));return el;
  };
  block(-52,-43,48,46,0,3.2,.15);
  block(-43,-38,30,36,3.3,4.1,.15);
  block(-24,-30,43,40,4.2,5.1,.15);
  const marks=mk('path',{class:'nf lo'},root);
  let rules='';
  for(let i=0;i<5;i++)rules+=seg(P(-15,-17+i*9,5.2),P(32-(i%2)*10,-17+i*9,5.2));
  marks.setAttribute('d',rules);
  const handle=solid(root),ferrule=solid(root),rim=solid(root);
  const outer=circ(25,64),inner=circ(20.5,64);
  rim.sil.classList.add('hi');
  function draw() {
    if(last===travel.x && lastReach===reach)return;
    last=travel.x;lastReach=reach;
    const x=-12+clamp(travel.x,0,1)*reach,y=-3,z=18;
    const Q=(u,v,w)=>P(u+x,v+y,w);
    const [hr,hi]=rings(18,-4,54,4,.15,.75);
    put(handle,prism(Q,front,hr,hi,z-1.3,z+1.3));
    const [fr,fi]=rings(20,-5,29,5,.15,.6);
    put(ferrule,prism(Q,front,fr,fi,z-1.5,z+1.5));
    const shape=prism(Q,front,outer,inner,z-1.8,z+2);
    // Reverse the inner boundary to cut the aperture out of the solid top.
    shape.sil+=poly(ringAt(Q,inner,z+2).reverse());
    put(rim,shape);
  }
  draw();read.textContent='rest';
  const loop=register(stage,dt=>{const moving=stepS(travel,dt);draw();return moving;});
  bag.add(loop.unregister);
  function release(){travel.t=.36;read.textContent='rest';loop.wake();}
  function aim([sx,sy]){
    const [x,y]=unproj(C,sx,sy,19);
    if(x < -49 || x > 69 || y < -37 || y > 35)return release();
    travel.t=clamp((x+25)/68,0,1);
    read.textContent=travel.t<.34?'Evidence':travel.t<.68?'Assumptions':'Implications';loop.wake();
  }
  bag.add(pointer(stage,{move:aim,down:aim,leave:release}));
  bag.add(()=>svg.replaceChildren());
  return {set:v=>{reach=clamp(v,16,32);draw();},destroy:bag.dispose};
}
hairline({
  name:'evidence-bench',
  means:'An open inspection lens moves over two evidence sheets, bringing their assumptions into view.',
  rules:[1,3,4,5,6,7,8,9,10],range:[16,24,32],
  tour:[[184,146],[227,161],[249,182],null],mount,
});
