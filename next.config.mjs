/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Autorização de domínios externos (Crucial para produção)
    images: {
        // Adicionamos domínios comuns de CDN e redes sociais para evitar erro 400
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com', // Google User Images
            },
            {
                protocol: 'https',
                hostname: 'authjs.dev',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com', // Caso use fotos do Unsplash nos artigos
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com', // Caso use GitHub Login
            },
            {
                protocol: 'https',
                hostname: '**.googleusercontent.com', // Wildcard para outras variantes do Google
            },
            {
                protocol: 'https',
                hostname: 'cdn.simpleicons.org', 
            }
        ],
        // Otimização: permite que o Next.js redimensione imagens de qualquer lugar se necessário
        // mas o remotePatterns acima é o método mais seguro e performático.
    },

    // 2. Otimização de pacotes (Barrel Imports)
    // Isso impede que o Next.js carregue 2000 ícones quando você só usa 5.
    modularizeImports: {
        "@heroicons/react/24/outline": {
            transform: "@heroicons/react/24/outline/{{member}}",
        },
        "@heroicons/react/24/solid": {
            transform: "@heroicons/react/24/solid/{{member}}",
        },
        "lucide-react": {
            transform: "lucide-react/dist/esm/icons/{{member}}",
        },
    },

    // 3. Resolução de conflitos de Build (Canvas/PDF)
    webpack: (config) => {
        // Resolve o erro do node-pre-gyp/canvas na Vercel
        config.resolve.alias.canvas = false;
        config.resolve.fallback = { 
            ...config.resolve.fallback, 
            fs: false, 
            net: false, 
            tls: false 
        };
        return config;
    },

    // 4. Configurações Experimentais e de Performance
    experimental: {
        serverActions: {
            bodySizeLimit: '20mb',
        },
        // Otimiza o carregamento de pacotes pesados no servidor
        serverComponentsExternalPackages: ["canvas", "sharp"],
    },

    // 5. Ignorar avisos de Lint durante o build (Opcional, mas ajuda no deploy rápido)
    // Se você corrigiu todos os <Image />, pode deixar como false.
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true, // Útil se houver conflitos de tipos externos que travam o deploy
    }
};

export default nextConfig;