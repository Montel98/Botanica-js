/*
 * A speed-improved simplex noise algorithm for 2D, 3D and 4D in JavaScript.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 */
export default function FastSimplexNoise(t){t||(t={}),this.amplitude=t.amplitude||1,this.frequency=t.frequency||1,this.octaves=parseInt(t.octaves||1),this.persistence=t.persistence||.5,this.random=t.random||Math.random
for(var e=new Uint8Array(256),i=0;256>i;i++)e[i]=i
for(var s,r,i=255;i>0;i--)s=Math.floor((i+1)*this.random()),r=e[i],e[i]=e[s],e[s]=r
this.perm=new Uint8Array(512),this.permMod12=new Uint8Array(512)
for(var i=0;512>i;i++)this.perm[i]=e[255&i],this.permMod12[i]=this.perm[i]%12}FastSimplexNoise.F2=.5*(Math.sqrt(3)-1),FastSimplexNoise.G2=(3-Math.sqrt(3))/6,FastSimplexNoise.F3=1/3,FastSimplexNoise.G3=1/6,FastSimplexNoise.F4=(Math.sqrt(5)-1)/4,FastSimplexNoise.G4=(5-Math.sqrt(5))/20,FastSimplexNoise.GRADIENTS_3D=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,-1],[0,1,-1],[0,-1,-1]],FastSimplexNoise.GRADIENTS_4D=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],FastSimplexNoise.dot2D=function(t,e,i){return t[0]*e+t[1]*i},FastSimplexNoise.dot3D=function(t,e,i,s){return t[0]*e+t[1]*i+t[2]*s},FastSimplexNoise.dot4D=function(t,e,i,s,r){return t[0]*e+t[1]*i+t[2]*s+t[3]*r},FastSimplexNoise.prototype.get2DNoise=function(t,e){for(var i=this.amplitude,s=this.frequency,r=0,o=0,a=0;a<this.octaves;a++)o+=this.getRaw2DNoise(t*s,e*s)*i,r+=i,i*=this.persistence,s*=2
return o/r},FastSimplexNoise.prototype.get3DNoise=function(t,e,i){for(var s=this.amplitude,r=this.frequency,o=0,a=0,p=0;p<this.octaves;p++)a+=this.getRaw3DNoise(t*r,e*r,i*r)*s,o+=s,s*=this.persistence,r*=2
return a/o},FastSimplexNoise.prototype.get4DNoise=function(t,e,i,s){for(var r=this.amplitude,o=this.frequency,a=0,p=0,h=0;h<this.octaves;h++)p+=this.getRaw4DNoise(t*o,e*o,i*o,s*o)*r,a+=r,r*=this.persistence,o*=2
return p/a},FastSimplexNoise.prototype.getCylindricalNoise=function(t,e,i){var s=e/t,r=t/(2*Math.PI),o=2*s*Math.PI,a=r*Math.sin(o),p=r*Math.cos(o)
return this.get3DNoise(a,p,i)},FastSimplexNoise.prototype.getCylindricalTimeNoise=function(t,e,i,s){var r=e/t,o=t/(2*Math.PI),a=2*r*Math.PI,p=o*Math.sin(a),h=o*Math.cos(a)
return this.get4DNoise(p,h,i,s)},FastSimplexNoise.prototype.getRaw2DNoise=function(t,e){var i,s,r,o,a,p=FastSimplexNoise.G2,h=FastSimplexNoise.dot2D,m=FastSimplexNoise.GRADIENTS_3D,n=(t+e)*FastSimplexNoise.F2,l=Math.floor(t+n),N=Math.floor(e+n),M=(l+N)*p,f=l-M,S=N-M,u=t-f,F=e-S
u>F?(o=1,a=0):(o=0,a=1)
var x=u-o+p,c=F-a+p,d=u-1+2*p,v=F-1+2*p,D=255&l,y=255&N,I=this.permMod12[D+this.perm[y]],g=this.permMod12[D+o+this.perm[y+a]],P=this.permMod12[D+1+this.perm[y+1]],G=.5-u*u-F*F
0>G?i=0:(G*=G,i=G*G*h(m[I],u,F))
var R=.5-x*x-c*c
0>R?s=0:(R*=R,s=R*R*h(m[g],x,c))
var q=.5-d*d-v*v
return 0>q?r=0:(q*=q,r=q*q*h(m[P],d,v)),70.1*(i+s+r)},FastSimplexNoise.prototype.getRaw3DNoise=function(t,e,i){var s,r,o,a,p,h,m,n,l,N,M=FastSimplexNoise.dot3D,f=FastSimplexNoise.GRADIENTS_3D,S=FastSimplexNoise.G3,u=(t+e+i)*FastSimplexNoise.F3,F=Math.floor(t+u),x=Math.floor(e+u),c=Math.floor(i+u),d=(F+x+c)*S,v=F-d,D=x-d,y=c-d,I=t-v,g=e-D,P=i-y
I>=g?g>=P?(p=1,h=0,m=0,n=1,l=1,N=0):I>=P?(p=1,h=0,m=0,n=1,l=0,N=1):(p=0,h=0,m=1,n=1,l=0,N=1):P>g?(p=0,h=0,m=1,n=0,l=1,N=1):P>I?(p=0,h=1,m=0,n=0,l=1,N=1):(p=0,h=1,m=0,n=1,l=1,N=0)
var G=I-p+S,R=g-h+S,q=P-m+S,w=I-n+2*S,A=g-l+2*S,T=P-N+2*S,E=I-1+3*S,_=g-1+3*S,U=P-1+3*S,C=255&F,b=255&x,j=255&c,k=this.permMod12[C+this.perm[b+this.perm[j]]],z=this.permMod12[C+p+this.perm[b+h+this.perm[j+m]]],B=this.permMod12[C+n+this.perm[b+l+this.perm[j+N]]],H=this.permMod12[C+1+this.perm[b+1+this.perm[j+1]]],J=.5-I*I-g*g-P*P
0>J?s=0:(J*=J,s=J*J*M(f[k],I,g,P))
var K=.5-G*G-R*R-q*q
0>K?r=0:(K*=K,r=K*K*M(f[z],G,R,q))
var L=.5-w*w-A*A-T*T
0>L?o=0:(L*=L,o=L*L*M(f[B],w,A,T))
var O=.5-E*E-_*_-U*U
return 0>O?a=0:(O*=O,a=O*O*M(f[H],E,_,U)),94.6*(s+r+o+a)},FastSimplexNoise.prototype.getRaw4DNoise=function(t,e,i,s){var r,o,a,p,h,m=FastSimplexNoise.dot4D,n=FastSimplexNoise.GRADIENTS_4D,l=FastSimplexNoise.G4,N=(t+e+i+s)*FastSimplexNoise.F4,M=Math.floor(t+N),f=Math.floor(e+N),S=Math.floor(i+N),u=Math.floor(s+N),F=(M+f+S+u)*l,x=M-F,c=f-F,d=S-F,v=u-F,D=t-x,y=e-c,I=i-d,g=s-v,P=0,G=0,R=0,q=0
D>y?P++:G++,D>I?P++:R++,D>g?P++:q++,y>I?G++:R++,y>g?G++:q++,I>g?R++:q++
var w,A,T,E,_,U,C,b,j,k,z,B
w=P>=3?1:0,A=G>=3?1:0,T=R>=3?1:0,E=q>=3?1:0,_=P>=2?1:0,U=G>=2?1:0,C=R>=2?1:0,b=q>=2?1:0,j=P>=1?1:0,k=G>=1?1:0,z=R>=1?1:0,B=q>=1?1:0
var H=D-w+l,J=y-A+l,K=I-T+l,L=g-E+l,O=D-_+2*l,Q=y-U+2*l,V=I-C+2*l,W=g-b+2*l,X=D-j+3*l,Y=y-k+3*l,Z=I-z+3*l,$=g-B+3*l,te=D-1+4*l,ee=y-1+4*l,ie=I-1+4*l,se=g-1+4*l,re=255&M,oe=255&f,ae=255&S,pe=255&u,he=this.perm[re+this.perm[oe+this.perm[ae+this.perm[pe]]]]%32,me=this.perm[re+w+this.perm[oe+A+this.perm[ae+T+this.perm[pe+E]]]]%32,ne=this.perm[re+_+this.perm[oe+U+this.perm[ae+C+this.perm[pe+b]]]]%32,le=this.perm[re+j+this.perm[oe+k+this.perm[ae+z+this.perm[pe+B]]]]%32,Ne=this.perm[re+1+this.perm[oe+1+this.perm[ae+1+this.perm[pe+1]]]]%32,Me=.5-D*D-y*y-I*I-g*g
0>Me?r=0:(Me*=Me,r=Me*Me*m(n[he],D,y,I,g))
var fe=.5-H*H-J*J-K*K-L*L
0>fe?o=0:(fe*=fe,o=fe*fe*m(n[me],H,J,K,L))
var Se=.5-O*O-Q*Q-V*V-W*W
0>Se?a=0:(Se*=Se,a=Se*Se*m(n[ne],O,Q,V,W))
var ue=.5-X*X-Y*Y-Z*Z-$*$
0>ue?p=0:(ue*=ue,p=ue*ue*m(n[le],X,Y,Z,$))
var Fe=.5-te*te-ee*ee-ie*ie-se*se
return 0>Fe?h=0:(Fe*=Fe,h=Fe*Fe*m(n[Ne],te,ee,ie,se)),72.3*(r+o+a+p+h)},FastSimplexNoise.prototype.getSphericalNoise=function(t,e,i){var s=e/t,r=i/t,o=2*s*Math.PI,a=r*Math.PI,p=Math.sin(a+Math.PI),h=2*Math.PI,m=h*Math.sin(o)*p,n=h*Math.cos(o)*p,l=h*Math.cos(a)
return this.get3DNoise(m,n,l)},FastSimplexNoise.prototype.getSphericalTimeNoise=function(t,e,i,s){var r=e/t,o=i/t,a=2*r*Math.PI,p=o*Math.PI,h=Math.sin(p+Math.PI),m=2*Math.PI,n=m*Math.sin(a)*h,l=m*Math.cos(a)*h,N=m*Math.cos(p)
return this.get4DNoise(n,l,N,s)},"undefined"!=typeof define&&define.amd&&define(function(){return FastSimplexNoise})/*,"undefined"!=typeof exports&&(exports.FastSimplexNoise=FastSimplexNoise),"undefined"!=typeof module&&(module.exports=FastSimplexNoise)*/
