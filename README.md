# Botanica-js

https://user-images.githubusercontent.com/40472971/162130434-786dcc68-be9e-452b-b784-c4d67fa315b6.mp4

## About
Bonsai trees procedurally generated using probabilitic L-Systems. The can grow, bloom and drop leaves depending on the time of year. The tree geometry is also dynamic - branches can be pruned and new shoots will grow. This is the online Javascript variant.

The source code consists of the following:
* Renderer *(WebGL)*
* Tree simulation *(Vanilla JS / GLSL)*
* Front-end to display trees *(ReactJS)*
* Back-end connector for tokenization extension *(NodeJS / ExpressJS / Cardano Serialization Lib)*

Demo site: https://www.botanicademo.com/

## Building from source

* Create a new directory for the source files
* ```cd``` and ```git clone github.com/Montel98```
* ```npm install webpack``` (If not already installed)
* ```npm run build``` to transpile the source code
* ```npm run server```
