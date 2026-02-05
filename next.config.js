/** @type {import('next').NextConfig} */

// Production'da GitHub Pages için basePath ayarı
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
  // ⚠️ RED LINE: GitHub Pages requires static export - DO NOT CHANGE
  output: 'export',
  
  // ⚠️ RED LINE: No image optimization server on GitHub Pages
  images: {
    unoptimized: true,
  },
  
  // Trailing slashes for GitHub Pages compatibility
  trailingSlash: true,
  
  // Base path for GitHub Pages project page (only in production)
  // Localhost'ta geliştirme yaparken basePath aktif olmaz
  basePath: isProduction ? '/marble-analyst' : '',
  
  // Asset prefix for proper resource loading on GitHub Pages
  assetPrefix: isProduction ? '/marble-analyst/' : '',
};

module.exports = nextConfig;
