const express = require("express")
const cors = require('cors');
const { GracefulShutdownServer } = require("medusa-core-utils")

const loaders = require("@medusajs/medusa/dist/loaders/index").default

  ; (async () => {
    async function start() {
      const app = express()
      const directory = process.cwd()

      try {
        // Use the cors middleware to enable CORS
        const STORE_CORS = process.env.STORE_CORS || "https://thecollegeroad.com";
        app.use(cors({
          origin: '*',
          methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
          credentials: true,
        }));



        const { container } = await loaders({
          directory,
          expressApp: app
        })
        const configModule = container.resolve("configModule")
        const port = process.env.PORT ?? configModule.projectConfig.port ?? 9000

        const server = GracefulShutdownServer.create(
          app.listen(port, (err) => {
            if (err) {
              return
            }
            console.log(`Server is ready on port: ${port}`)
          })
        )

        // Handle graceful shutdown
        const gracefulShutDown = () => {
          server
            .shutdown()
            .then(() => {
              console.info("Gracefully stopping the server.")
              process.exit(0)
            })
            .catch((e) => {
              console.error("Error received when shutting down the server.", e)
              process.exit(1)
            })
        }
        process.on("SIGTERM", gracefulShutDown)
        process.on("SIGINT", gracefulShutDown)
      } catch (err) {
        console.error("Error starting server", err)
        process.exit(1)
      }
    }

    await start()
  })()
