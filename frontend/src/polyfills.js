// Browser polyfills for Node.js modules
if (typeof global === 'undefined') {
    window.global = globalThis;
}

if (typeof process === 'undefined') {
    window.process = {
        env: {},
        browser: true,
        version: '',
        versions: { node: '16.0.0' }
    };
}

// Initialize Buffer polyfill
async function initBuffer() {
    if (typeof Buffer === 'undefined') {
        try {
            const { Buffer } = await import('buffer');
            window.Buffer = Buffer;
        } catch (error) {
            console.warn('Buffer polyfill not available:', error);
            // Simple Buffer fallback
            window.Buffer = {
                from: (data, encoding) => {
                    if (typeof data === 'string') {
                        return new TextEncoder().encode(data);
                    }
                    return data;
                },
                isBuffer: (obj) => obj instanceof Uint8Array
            };
        }
    }
}

// Initialize polyfills
initBuffer().catch(console.error);

export {};