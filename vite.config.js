export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600, // เพิ่มขีดจำกัดเป็น 1600 kB (1.6 MB)
  },
})