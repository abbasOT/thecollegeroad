// const express = require("express")
// const cors = require('cors');
// const { GracefulShutdownServer } = require("medusa-core-utils")


// const loaders = require("@medusajs/medusa/dist/loaders/index").default

//   ; (async () => {
//     async function start() {
//       const app = express()
//       const directory = process.cwd()

//       try {
//         // Use the cors middleware to enable CORS
//         const STORE_CORS = process.env.STORE_CORS || "https://thecollegeroad.com";
//         app.use(cors({
//           origin: '*',
//           methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//           credentials: true,
//         }));



//         const { container } = await loaders({
//           directory,
//           expressApp: app
//         })
//         const configModule = container.resolve("configModule")
//         const port = process.env.PORT ?? configModule.projectConfig.port ?? 9000

//         const server = GracefulShutdownServer.create(
//           app.listen(port, (err) => {
//             if (err) {
//               return
//             }
//             console.log(`Server is ready on port: ${port}`)
//           })
//         )

//         // Handle graceful shutdown
//         const gracefulShutDown = () => {
//           server
//             .shutdown()
//             .then(() => {
//               console.info("Gracefully stopping the server.")
//               process.exit(0)
//             })
//             .catch((e) => {
//               console.error("Error received when shutting down the server.", e)
//               process.exit(1)
//             })
//         }
//         process.on("SIGTERM", gracefulShutDown)
//         process.on("SIGINT", gracefulShutDown)
//       } catch (err) {
//         console.error("Error starting server", err)
//         process.exit(1)
//       }
//     }

//     await start()
//   })()

//new .............................................
const express = require("express");
const cors = require('cors');
const { GracefulShutdownServer } = require("medusa-core-utils");
const loaders = require("@medusajs/medusa/dist/loaders/index").default;
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

// Environment settings
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 9000;

// Path to the Next.js application directory
const nextAppDir = path.join(__dirname, '../ecommerce-octa'); // Adjusted path to Next.js project

// Initialize Next.js app
const app = next({ dev, hostname, port, dir: nextAppDir });
const handle = app.getRequestHandler();

(async () => {
  async function start() {
    const expressApp = express();

    try {
      // Use the CORS middleware to enable CORS
      const STORE_CORS = process.env.STORE_CORS || "http://circuithub.pk";
      expressApp.use(cors({
        origin: STORE_CORS,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
      }));

      // Load Medusa
      const { container } = await loaders({
        directory: __dirname, // Path to Medusa's server directory
        expressApp
      });
      const configModule = container.resolve("configModule");
      const medusaPort = configModule.projectConfig.port ?? 9000;

      // Prepare the Next.js app
      await app.prepare();

      // Create the server
      const server = GracefulShutdownServer.create(
        createServer(expressApp).listen(medusaPort, (err) => {
          if (err) {
            console.error('Error starting server:', err);
            process.exit(1);
          }
          console.log(`Server is ready on port: ${medusaPort}`);
        })
      );

      // Handle Next.js routes
      expressApp.all('*', (req, res) => {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;

        // Route requests based on path
        if (pathname.startsWith('/admin')) {
          // Admin routes (handled by Medusa)
          handle(req, res, parsedUrl);
        } else {
          // User routes (handled by Next.js)
          return handle(req, res, parsedUrl);
        }
      });

      // Handle graceful shutdown
      const gracefulShutDown = () => {
        server
          .shutdown()
          .then(() => {
            console.info("Gracefully stopping the server.");
            process.exit(0);
          })
          .catch((e) => {
            console.error("Error received when shutting down the server.", e);
            process.exit(1);
          });
      };
      process.on("SIGTERM", gracefulShutDown);
      process.on("SIGINT", gracefulShutDown);
    } catch (err) {
      console.error("Error starting server", err);
      process.exit(1);
    }
  }

  await start();
})();
