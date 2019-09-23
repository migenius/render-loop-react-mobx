# render-loop-react-mobx
A React/MobX reimplementation of the standard RealityServer Render Loop demo.

Designed to show how to use the [RealityServer Client](https://github.com/migenius/realityserver-client "RealityServer Client") in modern JavaScript frameworks. This demo integrates RealityServer using the [React](https://reactjs.org/ "React") framework with [MobX](https://mobx.js.org/ "MobX") for state handling. [webpack](https://webpack.js.org/ "webpack") is used to bundle the final project.

## How do I start?

Simply clone, build and run.

```
$ git clone https://github.com/migenius/render-loop-react-mobx.git
$ cd render-loop-react-mobx
$ npm install
```

At this stage you can either just build and then copy the output to your RealityServer content root:

```
$ npm build
$ mkdir -p $RS_ROOT/content_root/render-loop-react-mobx
$ cp build/* $RS_ROOT/content_root/render-loop-react-mobx
```

Then point your web browser to `/render-loop-react-mobx/` under your RealityServer base URL.

Or you can run a stand alone RealityServer and perform a dev build ensuring you pass your RealityServer host/port/ssl details so the application knows where to connect to:

$ npm run start -- --env.RS_HOST=localhost --env.RS_PORT=8080 --env.RS_SECURE=false

Note this will require having CORS enabled on your RealityServer to allow the `webpack-dev-server` to connect to the remote RealityServer.
