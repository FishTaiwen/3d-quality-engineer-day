/* 純座標碰撞與 BFS 尋路；不依賴 Three.js。 */
(function(root){
 'use strict';
 const factory=[
  {x:-18,z:-13,w:7,d:3},{x:-18,z:-3.2,w:4,d:1.8},{x:-6,z:-13,w:7,d:3},{x:-6,z:-3.5,w:5,d:2},
  {x:-17,z:8,w:5,d:2},{x:-7,z:8,w:4,d:2},{x:0,z:5.8,w:4,d:2},{x:18,z:-13,w:8,d:3},
  {x:17,z:5,w:7,d:3},{x:5,z:11,w:3,d:1.4},
  {x:11,z:-12.5,w:.8,d:9},{x:11,z:-1.5,w:.8,d:5},{x:18,z:1,w:14,d:.8}
 ];
 const home=[{x:-3,z:-5,w:5,d:2},{x:5,z:-4,w:5,d:3},{x:5,z:3,w:4,d:3},{x:-7,z:3,w:3,d:3}];
 const inside=(x,z)=>x>11&&z<1;
 function blocked(x,z,mode='factory',gateOpen=false,pad=.36){
  const bound=mode==='home'?{x:11,z:8}:{x:25,z:17};
  if(x< -bound.x+.5||x>bound.x-.5||z< -bound.z+.5||z>bound.z-.5)return true;
  const rects=mode==='home'?home:factory;
  if(rects.some(r=>Math.abs(x-r.x)<r.w/2+pad&&Math.abs(z-r.z)<r.d/2+pad))return true;
  return mode!=='home'&&!gateOpen&&Math.abs(x-11)<.45+pad&&z> -8.5&&z< -3.5;
 }
 function path(start,goal,mode='factory',gateOpen=false){
  const key=(x,z)=>`${x},${z}`;
  const sx=Math.round(start.x),sz=Math.round(start.z);
  let gx=Math.round(goal.x),gz=Math.round(goal.z);
  if(blocked(gx,gz,mode,gateOpen)){
    let best=null;
    for(let x=gx-3;x<=gx+3;x++)for(let z=gz-3;z<=gz+3;z++)if(!blocked(x,z,mode,gateOpen)){const d=(x-goal.x)**2+(z-goal.z)**2;if(!best||d<best.d)best={x,z,d};}
    if(!best)return [];gx=best.x;gz=best.z;
  }
  const queue=[[sx,sz]],came=new Map([[key(sx,sz),null]]);let read=0;
  while(read<queue.length){const [x,z]=queue[read++];if(x===gx&&z===gz)break;for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(!came.has(k)&&!blocked(nx,nz,mode,gateOpen)){came.set(k,[x,z]);queue.push([nx,nz]);}}}
  if(!came.has(key(gx,gz)))return [];
  const points=[];let cur=[gx,gz];while(cur){points.push({x:cur[0],z:cur[1]});cur=came.get(key(...cur));}points.reverse();return points.slice(1);
 }
 root.QE3Nav={factory,home,inside,blocked,path};if(typeof module!=='undefined')module.exports=root.QE3Nav;
})(typeof window!=='undefined'?window:globalThis);
