var R=Object.defineProperty;var h=r=>{throw TypeError(r)};var A=(r,e,t)=>e in r?R(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var o=(r,e,t)=>A(r,typeof e!="symbol"?e+"":e,t),d=(r,e,t)=>e.has(r)||h("Cannot "+t);var b=(r,e,t)=>(d(r,e,"read from private field"),t?t.call(r):e.get(r)),g=(r,e,t)=>e.has(r)?h("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(r):e.set(r,t),m=(r,e,t,i)=>(d(r,e,"write to private field"),i?i.call(r,t):e.set(r,t),t);import{U as p,V as B,k as a,W as c,X as q,Z as P,$ as w,a0 as X,a1 as F,_ as k,r as L,a2 as G,j as v,o as Y,a as D,O as N,b as j,c as W,d as K}from"./app-BTzxv8rx.js";function M(){return`#version 300 es

  #define attribute in

attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 u_viewProjection;
uniform vec3 u_position;
uniform vec3 u_size;

out vec2 v_uv;
void main() {
  vec3 scaledPosition = position.xyz * u_size; // Scale the quad
  vec4 worldPosition = vec4(scaledPosition + u_position, 1.0);
  gl_Position = u_viewProjection * worldPosition;
  v_uv = texcoord;
}
`}function U(){return`#version 300 es
precision highp float;

in vec2 v_uv;
uniform float u_progress;
uniform vec4 u_color;
uniform vec2 u_res;
uniform float u_top_offset;
uniform float u_blur_edge;

uniform float u_bubble_height;
uniform float u_bubble_squeeze_x_ramp;
uniform float u_bubble_squeeze_x;

out vec4 fragColor;


// Transform from 0->1 into -1->1 with inverted y
const mat3 normalisedSpace = mat3(
   2.0, 0.0, -1.0,
   0.0, -2.0, 1.0,
   0.0,  0.0, 1.0
);

///////////////////////////////////////////////////////////////////////////
float sampleCurveSDF(in vec2 pos, in mat3 transform) {
    vec3 uv3 = vec3(pos, 1.0) * transform;
    vec2 uv = uv3.xy;

    // Curve boundary: uv.x^2 == uv.y and uv.y <= 1.0
    // Inside = uv.x^2 < uv.y

    float curveY = uv.x * uv.x;

    // sdf hack below to combine multiple : 0.0-
    float distToCurve = 0.0-(uv.y - curveY);  // Positive = inside, Negative = outside
    float distToClip = 1.0 - uv.y;      // Clip at uv.y > 1.0

    // The "signed" part depends on where the point is relative to the curve
    // Apply the clip threshold as well
    if (uv.y > 1.0) {
        return -(uv.y - 1.0); // Outside vertical bounds
    }

    return distToCurve;
}


float curveAlphaSDF(vec2 ca, vec2 cb, vec2 cc, vec2 fragPosC, float pixSizeC) {
    vec2 right = cc - ca;
    vec2 up = cb - mix(ca, cc, 0.5);
    vec2 pos = ca;

    mat3 transform = inverse(mat3(
        right.x, up.x, pos.x,
        right.y, up.y, pos.y,
        0.0, 0.0, 1.0
    )) * normalisedSpace;

    return sampleCurveSDF(fragPosC, transform);
}


///////////////////////////////////////////////////////////////////////////


// Signed distance to a triangle by Inigo Quilez
float sdTriangle(in vec2 p1, in vec2 p2, in vec2 p3, in vec2 p) {
    vec2 e0 = p2 - p1;  vec2 e1 = p3 - p2;  vec2 e2 = p1 - p3;
    vec2 v0 = p - p1;   vec2 v1 = p - p2;   vec2 v2 = p - p3;

    vec2 pq0 = v0 - e0 * clamp(dot(v0,e0) / dot(e0,e0), 0.0, 1.0);
    vec2 pq1 = v1 - e1 * clamp(dot(v1,e1) / dot(e1,e1), 0.0, 1.0);
    vec2 pq2 = v2 - e2 * clamp(dot(v2,e2) / dot(e2,e2), 0.0, 1.0);

    vec2 d = min(min(vec2(dot(pq0, pq0), v0.x*e0.y - v0.y*e0.x),
                     vec2(dot(pq1, pq1), v1.x*e1.y - v1.y*e1.x)),
                     vec2(dot(pq2, pq2), v2.x*e2.y - v2.y*e2.x));

    return -sqrt(d.x) * sign(d.y);
}



float easeInSquare(float x){
 return x * x;
}

float easeOutQuart(float x) {
    x -= 1.0;
    return 1.0 - x * x * x * x;
}

float easeInOutCubic(float x) {
return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
}

void main() {
    float pixSize = 1.0 / u_res.y;
    vec2 fragPos = vec2(v_uv.x, 1.0-v_uv.y); // gl_FragCoord.xy * pixSize;
    fragPos.y -= u_top_offset; // bias to top - match in progress driver

    //progress
    float p = u_progress;
    float p2 = p;

    float centerY = mix(-0.02, 1.02, p);
    float centerX =  0.5;
    float y = centerY; // y position of the curve center
    float baseRange = u_bubble_height; // movement range of curve outer points from centerY (y)

    float midScaler = abs((p2) - 0.5) * 2.0; // 0 at middle 1 at progress 0 or 1

    //scale outer bounds
    float squeeze_x_range = 1.0 - u_bubble_squeeze_x_ramp;
    float equatorScalerX = easeInSquare(smoothstep(squeeze_x_range, 1.0, midScaler));

    //horizontally scale curve control points to increase curve tension
    float curveScalerX = easeOutQuart(smoothstep(0.0, 1.0, midScaler));

    float leftOffset = mix(-0.004, u_bubble_squeeze_x, equatorScalerX );
    float curveControlOffset = mix(0.5, 0.5, curveScalerX );

    float left = leftOffset;
    float right = 1.0-leftOffset;
    float base = mix(centerY - baseRange, centerY + baseRange, easeInOutCubic(p2));

    vec2 a = vec2(left, base);
    vec2 b = vec2(centerX - curveControlOffset, y);
    vec2 c = vec2(centerX, y);
    float curve1 = curveAlphaSDF(a, b, c, fragPos, pixSize);

    a = vec2(centerX, y);
    b = vec2(centerX + curveControlOffset, y);
    c = vec2(right, base);
    float curve2 = curveAlphaSDF(a, b, c, fragPos, pixSize);

    // setup triangle points
    a = vec2(left, base);
    b = vec2(centerX, y);
    c = vec2(right, base);


    float aa = pixSize * 20.0;
    float centerXBlurMul = smoothstep(0.0, 0.5, abs(fragPos.x - 0.5 )) * 12.0;
    centerXBlurMul = 1.0 + (centerXBlurMul * u_blur_edge);
    aa *= centerXBlurMul;

    // aa distance to combined sdfs (note combining all interior shape(y)
    // - see: sdf hack in sampleCurveSDF )
    float dist = max(curve1, curve2);
    float outA = smoothstep(aa, 0.0, dist);

    //flip shape after edgesY moves past centerY
    if (p < 0.5) {
        outA = 1.0 - outA;
    }

    outA = clamp(outA, 0.0, 1.0);
    vec4 color = vec4(u_color.rgb*outA, outA);

    fragColor = vec4(color);
}
`}const V={FALL_BACK_TO_STATIC:"FALL_BACK_TO_STATIC"};var f;class Q{constructor({element:e,u_color:t=[...p.YELLOW],onFallBackToStatic:i=null,renderIfTopLayer:s=!0,renderIfScrollLayer:n=!0}={}){o(this,"glLayerID",null);o(this,"renderOrder",-1);o(this,"destroyed",!1);o(this,"element",null);o(this,"programInfo",null);o(this,"bufferInfo",null);o(this,"renderIfTopLayer",!1);o(this,"renderIfScrollLayer",!0);o(this,"vw",1e3);o(this,"vh",1e3);o(this,"u_viewProjection",null);o(this,"u_progress",0);o(this,"u_color",[...p.YELLOW]);o(this,"u_res",[1920,1080]);o(this,"u_position",[0,0,0]);o(this,"u_size",[200,200,1]);o(this,"u_blur_edge",0);g(this,f,!1);o(this,"u_bubble_height",.67);o(this,"u_bubble_squeeze_x_ramp",1);o(this,"u_bubble_squeeze_x",.5);o(this,"setupGLLayer",()=>{a.glLayer?this.init():a.on(c.GL_LAYER,this.onGLLayerChange)});o(this,"onGLLayerChange",e=>{e&&!this.glLayerID?this.init():this.onContextLost()});o(this,"onContextLost",e=>{console.warn("BUBBLE WebGL context lost"),this.fallbackToStatic(),this.destroy()});o(this,"onContextRestored",e=>{console.info("BUBBLE WebGL context restored")});o(this,"fallbackToStatic",e=>{var t;this.emit(V.FALL_BACK_TO_STATIC),(t=this.onFallBackToStatic)==null||t.call(this)});o(this,"init",()=>{var s;if(this.glLayerID=a.glLayer.id,!this.isOk){console.warn("!! WebGL not supported"),this.onContextLost();return}const{gl:e}=this;this.addEvents();const t=M(),i=U();this.programInfo=q(e,[t,i]),this.bufferInfo=a.glLayer.createQuadBufferInfo(),this.resize(),(s=a.glLayer)==null||s.addToRenderList(this)});o(this,"onResizeCanvas",()=>{this.resize()});o(this,"onResizeElement",()=>{this.resize()});o(this,"resize",()=>{this.vw=window.innerWidth,this.vh=P.lvh,this.updateLayout()});o(this,"updateLayout",()=>{if(!this.isOk)return;const{pixelRatio:e}=a.glLayer,t=this.element.getBoundingClientRect(),{top:i,left:s,width:n,height:u}=t;this.u_position[0]=s*e,this.u_position[1]=i*e,this.u_size[0]=n*e,this.u_size[1]=u*e});o(this,"updateFrame",()=>{});o(this,"render",({width:e,height:t,projectionMatrix:i})=>{if(!this.shouldRender)return;const s=e/t;this.isPortrait=s<.8,this.u_res[0]=this.u_size[0],this.u_res[1]=this.u_size[1],this.u_viewProjection=i;const{gl:n,programInfo:u,bufferInfo:l,u_viewProjection:_,u_color:y,u_progress:x,u_res:C,u_position:S,u_size:O,u_blur_edge:T,u_bubble_height:z,u_bubble_squeeze_x_ramp:I,u_bubble_squeeze_x:E}=this;this.isOk&&(n.useProgram(u.program),w(n,u,l),X(u,{u_viewProjection:_,u_progress:x,u_color:y,u_res:C,u_position:S,u_size:O,u_blur_edge:T,u_bubble_height:z,u_bubble_squeeze_x_ramp:I,u_bubble_squeeze_x:E}),F(n,l,n.TRIANGLE_STRIP))});Object.assign(this,B),this.element=e,this.u_color=t||this.u_color,this.onFallBackToStatic=i,this.renderIfTopLayer=s,this.renderIfScrollLayer=n,this.setupGLLayer()}addEvents(){this.removeEvents(),this.resizeObserver=new ResizeObserver(this.onResizeElement),this.resizeObserver.observe(this.element),a.on(c.CONTEXT_LOST,this.onContextLost),a.on(c.CONTEXT_RESTORED,this.onContextRestored),a.on(c.GL_LAYER,this.onGLLayerChange)}removeEvents(){var e;(e=this.resizeObserver)==null||e.disconnect(),this.resizeObserver=null,a.off(c.GL_LAYER,this.onGLLayerChange),a.off(c.CONTEXT_LOST,this.onContextLost),a.off(c.CONTEXT_RESTORED,this.onContextRestored)}get gl(){var t,i;return this.glLayerID&&this.glLayerID===((t=a.glLayer)==null?void 0:t.id)?(i=a.glLayer)==null?void 0:i.gl:null}get shouldRenderOnLayerZ(){const e=a.isTopLayer;return e&&this.renderIfTopLayer||!e&&this.renderIfScrollLayer}get isOk(){return!this.destroyed&&this.gl&&!this.gl.isContextLost()}get isPortrait(){return b(this,f)}set isPortrait(e){m(this,f,e),this.u_bubble_height=e?.25:.67,this.u_bubble_squeeze_x_ramp=e?.6:1,this.u_bubble_squeeze_x=e?.2:.5}get shouldRender(){const e=this.u_progress<=1,t=this.shouldRenderOnLayerZ;return this.isOk&&t&&e}destroy(){var s,n;if(this.destroyed)return;this.destroyed=!0,(n=(s=a.glLayer)==null?void 0:s.removeFromRenderList)==null||n.call(s,this),this.removeEvents();const{gl:e,programInfo:t,bufferInfo:i}=this;e&&!e.isContextLost()&&(t!=null&&t.program&&e.deleteProgram(t.program),i&&i.numElements&&Object.values(i.attribs).forEach(u=>{u.buffer&&e.deleteBuffer(u.buffer)})),this.programInfo=null,this.bufferInfo=null}}f=new WeakMap;const Z={class:"BubbleLoader"},$={__name:"BubbleLoader",props:{fillColor:{default:[...p.YELLOW]},progress:{default:0}},setup(r){const e=r,t=L(null),i=L(!1);let s;function n(){s=new Q({element:t.value,u_color:e.fillColor,onFallBackToStatic:()=>{i.value=!0}})}function u(){s==null||s.destroy(),s=null}return G({elRef:t}),v(t,l=>{l&&n()}),v(()=>e.fillColor,l=>{s&&(s.u_color=e.fillColor)}),v(()=>e.progress,l=>{s&&(s.u_progress=e.progress)}),Y(()=>{i.value=!1}),D(()=>{setTimeout(()=>u(),N.LEAVE*1e3*.9)}),(l,_)=>(j(),W("div",Z,[K("div",{ref_key:"bubbleContainerRef",ref:t,class:"BubbleLoader-canvas-parent"},null,512)]))}},ee=k($,[["__scopeId","data-v-a1163a24"]]);export{ee as _};
