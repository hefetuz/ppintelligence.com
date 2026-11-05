const {
  Cam, clamp, disposer, facing, fillet, fit, hull, mk, open, pointer, poly,
  prism, proj, put, rad, register, rings, rrect, seg, solid, spring, stepS,
} = HL;

const REST_TURN = 17, HEIGHT = 78, HIT = [45, 355, 35, 285];
const rotate = ([x,y], angle) => {
  const a=rad(angle), c=Math.cos(a), s=Math.sin(a);
  return [x*c-y*s,x*s+y*c];
};

// Three immutable rounded glass shapes, repeated around a real rotating source disc.
// The triangular mirror field crops them; alternating reflections create the view.
function sourceChips(angle) {
  const shapes=[
    {r:10, a:-12, p:[[0,-5],[5,0],[0,5],[-5,0]]},
    {r:23, a:16, p:[[-7,-4],[7,-4],[7,4],[-7,4]]},
    {r:33, a:-17, p:[[-2,-5],[5,0],[-2,5]]},
  ];
  return Array.from({length:6},(_,sector)=>shapes.map(shape=>{
    const centre=rotate([shape.r,0],shape.a);
    return fillet(shape.p,shape.p.map(()=>1.1),4).map(p=>
      rotate([p[0]+centre[0],p[1]+centre[1]],angle+sector*60));
  })).flat();
}

function clipSector(polygon) {
  let points=polygon;
  for(const sign of [-1,1]) {
    const next=[], distance=p=>p[0]/Math.sqrt(3)+sign*p[1];
    for(let i=0;i<points.length;i++) {
      const a=points[i], b=points[(i+1)%points.length], da=distance(a), db=distance(b);
      if(da>=0) next.push(a);
      if((da>=0)!==(db>=0)) {
        const t=da/(da-db); next.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
      }
    }
    points=next;
  }
  return points.length>=3?points:[];
}

function reflectSector(points, index) {
  return points.map(([x,y])=>rotate([x,y*(index%2?-1:1)],index*60));
}

function opticalPattern(angle) {
  const field=sourceChips(angle).map(clipSector).filter(p=>p.length);
  return Array.from({length:6},(_,i)=>field.map(p=>reflectSector(p,i))).flat();
}

function mount({stage,svg,read}, value) {
  const bag=disposer(), C=Cam(45,.5,1.58);
  fit(C,[[-90,-48,-6],[-90,48,126],[78,-48,-6],[78,48,126]],191,143);
  const P=proj(C), front=facing(C), root=mk("g",{},svg);
  const circle=(x,r,n=96)=>Array.from({length:n},(_,i)=>{
    const a=i*2*Math.PI/n; return P(x,r*Math.cos(a),HEIGHT+r*Math.sin(a));
  });
  function cylinder(x0,r0,x1,r1) {
    const el=solid(root);
    put(el,{sil:poly(hull([...circle(x0,r0),...circle(x1,r1)])),crease:poly(circle(x1,r1-1.6))});
    return el;
  }

  const br=rrect(-67,-38,59,38,13,14), bi=rrect(-65,-36,57,36,11,14);
  put(solid(root),prism(P,front,br,bi,-6,0));
  const [sr,si]=rings(-36,-13,-20,13,5,1.4);
  put(solid(root),prism(P,front,sr,si,0,58));
  // Eyepiece, tapered mirror tube and broad rotating chamber are separate opaque solids.
  cylinder(-90,15,-76,20);
  cylinder(-76,23,43,42);
  cylinder(40,44,62,47);
  const grip=mk("path",{class:"nf lo"},root);
  const face=mk("path",{class:"sil",d:poly(circle(63,42))},root);
  const aperture=mk("path",{class:"sil",d:poly(circle(64,38.5))},root);
  const reflections=mk("path",{class:"sil"},root);
  const rim=mk("path",{class:"nf sil hi",d:poly(circle(64,41))},root);
  const turn=spring(REST_TURN);
  let reach=value, over=null, drawn=NaN;

  function draw() {
    const angle=clamp(turn.x,-180,180);
    if(angle===drawn) return;
    drawn=angle;
    reflections.setAttribute("d",opticalPattern(angle).map(points=>
      poly(points.map(([u,v])=>P(64.2,u,HEIGHT+v)))).join(""));
    // Only marks on the camera-facing half of the opaque collar can be seen.
    const lines=[];
    for(let i=0;i<36;i++) {
      const a=rad(i*10+angle), y=Math.cos(a), z=Math.sin(a);
      if(Math.sqrt(3/8)*y+.5*z<=.12) continue;
      lines.push(seg(P(45,44.7*y,HEIGHT+44.7*z),P(57,46.3*y,HEIGHT+46.3*z)));
    }
    grip.setAttribute("d",lines.join(""));
  }

  draw(); read.textContent="rest";
  const loop=register(stage,dt=>{const moving=stepS(turn,dt);draw();return moving;});
  bag.add(loop.unregister);
  function aim(p) {
    over=p;
    if(!p || p[0]<HIT[0] || p[0]>HIT[1] || p[1]<HIT[2] || p[1]>HIT[3]) {
      over=null;turn.t=REST_TURN;read.textContent="rest";
    } else {
      turn.t=clamp((p[0]-200)/145,-1,1)*reach;
      read.textContent=`turn ${Math.round(turn.t)}°`;
    }
    rim.classList.toggle("hi",!over);
    reflections.classList.toggle("hi",!!over);
    loop.wake();
  }
  bag.add(pointer(stage,{move:aim,down:aim,leave:()=>aim(null)}));
  bag.add(()=>svg.replaceChildren());
  return {set:next=>{reach=clamp(next,30,130);aim(over);},destroy:bag.dispose};
}

hairline({
  name:"possibility-kaleidoscope",
  means:"A rotating kaleidoscope chamber reveals different possibilities in the same three geometric forms.",
  rules:[1,3,4,5,6,7,8,9,10],
  range:[30,80,130],
  mount,
});
