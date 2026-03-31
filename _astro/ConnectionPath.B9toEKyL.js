import{c}from"./createLucideIcon.xD6jD0Ge.js";import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{R as g}from"./index.DMVOjPfi.js";import{A as j,a as b,b as N}from"./dialog.BDjyO8XK.js";/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=[["path",{d:"M12 12h.01",key:"1mp3jc"}],["path",{d:"M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",key:"1ksdt3"}],["path",{d:"M22 13a18.15 18.15 0 0 1-20 0",key:"12hx5q"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]],A=c("briefcase-business",v);/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=[["path",{d:"m6 17 5-5-5-5",key:"xnjwq"}],["path",{d:"m13 17 5-5-5-5",key:"17xmmf"}]],k=c("chevrons-right",y);/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]],F=c("map-pin",_);/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],z=c("shield-check",C);function w(r){return r.split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase()}function $(r){return r.startsWith("Colleagues ")?r.slice(11):r}function m({name:r,role:s,avatarUrl:n,href:a}){const o=e.jsxs(e.Fragment,{children:[e.jsxs(j,{className:`h-10 w-10 shrink-0 border-2 border-background shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] transition-colors${a?" group-hover/member:border-primary":""}`,children:[e.jsx(b,{src:n??void 0,alt:r}),e.jsx(N,{className:"text-xs font-semibold",children:w(r)})]}),e.jsxs("div",{className:"flex flex-col",children:[e.jsx("span",{className:`text-base font-semibold text-card-foreground leading-tight transition-colors${a?" group-hover/member:text-primary":""}`,children:r}),e.jsx("span",{className:"text-xs text-muted-foreground",children:s})]})]});return a?e.jsx("a",{href:a,className:"flex items-center gap-2 group/member",children:o}):e.jsx("div",{className:"flex items-center gap-2",children:o})}function h({label:r}){return e.jsx("div",{className:"ml-5 border-l border-border pl-5 h-9 flex items-center gap-3.5",children:e.jsxs("div",{className:"flex items-center gap-0.5 min-w-0",children:[e.jsx(k,{className:"h-3 w-3 text-muted-foreground/75 shrink-0 mb-px"}),e.jsx("p",{className:"text-xs text-muted-foreground/75 leading-none truncate",children:r})]})})}function B({connectionPath:r,connectionDegree:s,resolveNode:n,basePath:a="/trusted-list",hideHeader:o=!1}){const u=s==="3rd+"||s==="3rd"||s==="none",d=n(r[0]),f=r[r.length-1],l=n(f),x=t=>`${a}/members/${t.toLowerCase().replace(/\s+/g,"-")}`;return e.jsxs("div",{className:"flex flex-col gap-3.5",children:[!o&&e.jsx("p",{className:"text-xs text-muted-foreground tracking-widest uppercase",children:"Your Connection"}),e.jsx("div",{className:"flex flex-col",children:u?e.jsxs(e.Fragment,{children:[e.jsx(m,{name:d.name,role:d.role,avatarUrl:d.avatarUrl,href:`${a}/profile`}),e.jsx(h,{label:s==="none"?"Not connected":"Connected indirectly"}),e.jsx(m,{name:l.name,role:l.role,avatarUrl:l.avatarUrl,href:x(l.name)})]}):r.map((t,p)=>{const i=n(t);return e.jsxs(g.Fragment,{children:[p>0&&t.relationship&&e.jsx(h,{label:$(t.relationship)}),e.jsx(m,{name:i.name,role:i.role,avatarUrl:i.avatarUrl,href:t.type==="you"?`${a}/profile`:x(i.name)})]},p)})})]})}export{A as B,B as C,F as M,z as S};
