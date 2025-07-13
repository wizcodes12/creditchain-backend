const { create } = require("ipfs-http-client")
const logger = require("../utils/logger")
const { getConfig } = require("../config/environment")

class IPFSService {
  constructor() {
    this.config = getConfig()
    this.client = null
    this.initialize()
  }

  initialize() {
    try {
      if (this.config.ipfs.projectId && this.config.ipfs.projectSecret) {
        const auth =
          "Basic " + Buffer.from(this.config.ipfs.projectId + ":" + this.config.ipfs.projectSecret).toString("base64")

        this.client = create({
          host: "ipfs.infura.io",
          port: 5001,
          protocol: "https",
          headers: {
            authorization: auth,
          },
        })
      } else {
        // Fallback to local IPFS node or public gateway
        this.client = create({ url: "https://ipfs.infura.io:5001" })
      }

      logger.info("IPFS service initialized")
    } catch (error) {
      logger.error("IPFS initialization error:", error)
      this.client = null
    }
  }

  async uploadData(data) {
    try {
      if (!this.client) {
        throw new Error("IPFS client not initialized")
      }

      logger.info("Uploading data to IPFS")

      const dataString = JSON.stringify(data, null, 2)
      const result = await this.client.add(dataString)

      const ipfsHash = result.cid.toString()
      const gatewayUrl = `${this.config.ipfs.gatewayUrl}${ipfsHash}`

      logger.info("Data uploaded to IPFS", {
        ipfsHash: ipfsHash.substring(0, 10) + "...",
        size: dataString.length,
      })

      return {
        ipfsHash,
        gatewayUrl,
        size: dataString.length,
      }
    } catch (error) {
      logger.error("IPFS upload error:", error)
      throw new Error(`IPFS upload failed: ${error.message}`)
    }
  }

  async retrieveData(ipfsHash) {
    try {
      if (!this.client) {
        throw new Error("IPFS client not initialized")
      }

      logger.info("Retrieving data from IPFS", {
        ipfsHash: ipfsHash.substring(0, 10) + "...",
      })

      const chunks = []
      for await (const chunk of this.client.cat(ipfsHash)) {
        chunks.push(chunk)
      }

      const dataString = Buffer.concat(chunks).toString()
      const data = JSON.parse(dataString)

      logger.info("Data retrieved from IPFS", {
        ipfsHash: ipfsHash.substring(0, 10) + "...",
        size: dataString.length,
      })

      return data
    } catch (error) {
      logger.error("IPFS retrieval error:", error)
      throw new Error(`IPFS retrieval failed: ${error.message}`)
    }
  }

  generateGatewayUrl(ipfsHash) {
    return `${this.config.ipfs.gatewayUrl}${ipfsHash}`
  }

  async pinData(ipfsHash) {
    try {
      if (!this.client) {
        throw new Error("IPFS client not initialized")
      }

      await this.client.pin.add(ipfsHash)
      logger.info("Data pinned to IPFS", {
        ipfsHash: ipfsHash.substring(0, 10) + "...",
      })

      return true
    } catch (error) {
      logger.error("IPFS pinning error:", error)
      return false
    }
  }
}

module.exports = new IPFSService()
