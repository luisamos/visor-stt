export default {
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 100000,
  },
  define: {
    global: 'globalThis'
  },
  server: {
    cors: true,
    port: 82,
  }
}