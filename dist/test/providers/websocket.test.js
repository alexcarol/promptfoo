"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const websocket_1 = require("../../src/providers/websocket");
jest.mock('ws');
describe('createTransformResponse', () => {
    it('should use provided function parser', () => {
        const parser = (data) => ({ output: `parsed-${data}` });
        const transform = (0, websocket_1.createTransformResponse)(parser);
        expect(transform('test')).toEqual({ output: 'parsed-test' });
    });
    it('should create function from string parser', () => {
        const parser = '({ output: `parsed-${data}` })';
        const transform = (0, websocket_1.createTransformResponse)(parser);
        expect(transform('test')).toEqual({ output: 'parsed-test' });
    });
    it('should return default transform if no parser provided', () => {
        const transform = (0, websocket_1.createTransformResponse)(undefined);
        expect(transform('test')).toEqual({ output: 'test' });
    });
});
describe('WebSocketProvider', () => {
    let mockWs;
    let provider;
    beforeEach(() => {
        mockWs = {
            on: jest.fn(),
            send: jest.fn(),
            close: jest.fn(),
            onmessage: jest.fn(),
            onerror: jest.fn(),
            onopen: jest.fn(),
        };
        jest.mocked(ws_1.default).mockImplementation(() => mockWs);
        provider = new websocket_1.WebSocketProvider('ws://test.com', {
            config: {
                messageTemplate: '{{ prompt }}',
                timeoutMs: 1000,
            },
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should initialize with correct config', () => {
        expect(provider.url).toBe('ws://test.com');
        expect(provider.config.messageTemplate).toBe('{{ prompt }}');
    });
    it('should pass headers to WebSocket connection', async () => {
        const headers = {
            Authorization: 'Bearer test-token',
            'Custom-Header': 'test-value',
        };
        provider = new websocket_1.WebSocketProvider('ws://test.com', {
            config: {
                messageTemplate: '{{ prompt }}',
                headers,
            },
        });
        // Mock WebSocket to handle the connection properly
        jest.mocked(ws_1.default).mockImplementation(() => {
            setTimeout(() => {
                mockWs.onopen?.({ type: 'open', target: mockWs });
                setTimeout(() => {
                    mockWs.onmessage?.({
                        data: JSON.stringify({ result: 'test' }),
                    });
                }, 10);
            }, 10);
            return mockWs;
        });
        // Trigger the WebSocket connection by calling callApi
        await provider.callApi('test prompt');
        // Now assert that WebSocket was called with the headers
        expect(ws_1.default).toHaveBeenCalledWith('ws://test.com', { headers });
    });
    it('should work without headers provided', async () => {
        provider = new websocket_1.WebSocketProvider('ws://test.com', {
            config: {
                messageTemplate: '{{ prompt }}',
                // No headers provided
            },
        });
        // Mock WebSocket to handle the connection properly
        jest.mocked(ws_1.default).mockImplementation(() => {
            setTimeout(() => {
                mockWs.onopen?.({ type: 'open', target: mockWs });
                setTimeout(() => {
                    mockWs.onmessage?.({
                        data: JSON.stringify({ result: 'test' }),
                    });
                }, 10);
            }, 10);
            return mockWs;
        });
        // Trigger the WebSocket connection by calling callApi
        const response = await provider.callApi('test prompt');
        // Should still work and return expected response
        expect(response).toEqual({ output: { result: 'test' } });
        // When headers are not provided, the options object should be empty
        expect(ws_1.default).toHaveBeenCalledWith('ws://test.com', {});
    });
    it('should throw if messageTemplate is missing', () => {
        expect(() => {
            new websocket_1.WebSocketProvider('ws://test.com', {
                config: {},
            });
        }).toThrow('Expected WebSocket provider ws://test.com to have a config containing {messageTemplate}');
    });
    it('should send message and handle response', async () => {
        const responseData = { result: 'test response' };
        jest.mocked(ws_1.default).mockImplementation(() => {
            setTimeout(() => {
                mockWs.onopen?.({ type: 'open', target: mockWs });
                setTimeout(() => {
                    mockWs.onmessage?.({ data: JSON.stringify(responseData) });
                }, 10);
            }, 10);
            return mockWs;
        });
        const response = await provider.callApi('test prompt');
        expect(response).toEqual({ output: responseData });
        expect(mockWs.close).toHaveBeenCalled();
    });
    it('should handle WebSocket errors', async () => {
        jest.mocked(ws_1.default).mockImplementation(() => {
            setTimeout(() => {
                mockWs.onerror?.({
                    type: 'error',
                    error: new Error('connection failed'),
                    message: 'connection failed',
                });
            }, 10);
            return mockWs;
        });
        await expect(provider.callApi('test prompt')).rejects.toThrow('WebSocket error');
        expect(mockWs.close).toHaveBeenCalled();
    });
    it('should handle timeout', async () => {
        provider = new websocket_1.WebSocketProvider('ws://test.com', {
            config: {
                messageTemplate: '{{ prompt }}',
                timeoutMs: 100,
            },
        });
        await expect(provider.callApi('test prompt')).rejects.toThrow('WebSocket request timed out');
        expect(mockWs.close).toHaveBeenCalled();
    });
    it('should handle non-JSON response', async () => {
        jest.mocked(ws_1.default).mockImplementation(() => {
            setTimeout(() => {
                mockWs.onopen?.({ type: 'open', target: mockWs });
                setTimeout(() => {
                    mockWs.onmessage?.({ data: 'plain text response' });
                }, 10);
            }, 10);
            return mockWs;
        });
        const response = await provider.callApi('test prompt');
        expect(response).toEqual({ output: 'plain text response' });
        expect(mockWs.close).toHaveBeenCalled();
    });
    it('should use custom response transformer', async () => {
        provider = new websocket_1.WebSocketProvider('ws://test.com', {
            config: {
                messageTemplate: '{{ prompt }}',
                transformResponse: (data) => ({ output: `transformed-${data}` }),
            },
        });
        jest.mocked(ws_1.default).mockImplementation(() => {
            setTimeout(() => {
                mockWs.onopen?.({ type: 'open', target: mockWs });
                setTimeout(() => {
                    mockWs.onmessage?.({ data: 'test' });
                }, 10);
            }, 10);
            return mockWs;
        });
        const response = await provider.callApi('test prompt');
        expect(response).toEqual({ output: 'transformed-test' });
        expect(mockWs.close).toHaveBeenCalled();
    });
    describe('streamResponse behavior', () => {
        it('should stream chunks and resolve when stream signals complete', async () => {
            let callCount = 0;
            const chunks = ['hello ', 'world'];
            const streamResponse = (accumulator, event) => {
                const previousOutput = typeof accumulator.output === 'string' ? accumulator.output : '';
                const currentChunk = typeof event?.data === 'string' ? event.data : String(event?.data ?? event);
                const merged = { output: previousOutput + currentChunk };
                callCount += 1;
                const isComplete = callCount === chunks.length ? 'DONE' : '';
                return [merged, isComplete];
            };
            provider = new websocket_1.WebSocketProvider('ws://test.com', {
                config: {
                    messageTemplate: '{{ prompt }}',
                    streamResponse,
                    transformResponse: (data) => ({ output: data.output }),
                },
            });
            jest.mocked(ws_1.default).mockImplementation(() => {
                setTimeout(() => {
                    mockWs.onopen?.({ type: 'open', target: mockWs });
                    setTimeout(() => {
                        mockWs.onmessage?.({ data: chunks[0] });
                        setTimeout(() => {
                            mockWs.onmessage?.({ data: chunks[1] });
                        }, 5);
                    }, 5);
                }, 5);
                return mockWs;
            });
            const response = await provider.callApi('ignored');
            expect(response).toEqual({ output: 'hello world' });
            expect(mockWs.close).toHaveBeenCalledTimes(1);
        });
        it('should complete immediately if stream signals completion on first message', async () => {
            const streamResponse = (_acc, event) => [
                { output: String(event?.data ?? event) },
                true,
            ];
            provider = new websocket_1.WebSocketProvider('ws://test.com', {
                config: {
                    messageTemplate: '{{ prompt }}',
                    streamResponse,
                    transformResponse: (data) => ({ output: data.output }),
                },
            });
            jest.mocked(ws_1.default).mockImplementation(() => {
                setTimeout(() => {
                    mockWs.onopen?.({ type: 'open', target: mockWs });
                    setTimeout(() => {
                        mockWs.onmessage?.({ data: 'chunk' });
                    }, 5);
                }, 5);
                return mockWs;
            });
            const response = await provider.callApi('ignored');
            expect(response).toEqual({ output: 'chunk' });
            expect(mockWs.close).toHaveBeenCalledTimes(1);
        });
        it('should pass context as third argument to streamResponse', async () => {
            let received = null;
            const streamResponse = (acc, event, ctx) => {
                received = [acc, event, ctx];
                return [{ output: 'ok' }, true];
            };
            provider = new websocket_1.WebSocketProvider('ws://test.com', {
                config: {
                    messageTemplate: '{{ prompt }}',
                    streamResponse,
                    transformResponse: (data) => ({ output: data.output }),
                },
            });
            jest.mocked(ws_1.default).mockImplementation(() => {
                setTimeout(() => {
                    mockWs.onopen?.({ type: 'open', target: mockWs });
                    setTimeout(() => {
                        mockWs.onmessage?.({ data: 'chunk' });
                    }, 5);
                }, 5);
                return mockWs;
            });
            const context = { vars: { x: 1 }, debug: true };
            const response = await provider.callApi('ignored', context);
            expect(response).toEqual({ output: 'ok' });
            expect(received).not.toBeNull();
            expect(received?.[2]).toEqual(context);
        });
        it('should reject when streamResponse function throws an error', async () => {
            const streamResponse = (_acc, _event) => {
                throw new Error('Stream processing failed');
            };
            provider = new websocket_1.WebSocketProvider('ws://test.com', {
                config: {
                    messageTemplate: '{{ prompt }}',
                    streamResponse,
                    transformResponse: (data) => ({ output: data.output }),
                },
            });
            jest.mocked(ws_1.default).mockImplementation(() => {
                setTimeout(() => {
                    mockWs.onopen?.({ type: 'open', target: mockWs });
                    setTimeout(() => {
                        mockWs.onmessage?.({ data: 'chunk' });
                    }, 5);
                }, 5);
                return mockWs;
            });
            await expect(provider.callApi('test')).rejects.toThrow('Error executing streamResponse function: Error in stream response function: Stream processing failed');
            expect(mockWs.close).toHaveBeenCalled();
        });
        it('should reject when streamResponse string transform throws an error', async () => {
            provider = new websocket_1.WebSocketProvider('ws://test.com', {
                config: {
                    messageTemplate: '{{ prompt }}',
                    streamResponse: '(acc, data, ctx) => { throw new Error("String transform failed"); }',
                    transformResponse: (data) => ({ output: data.output }),
                },
            });
            jest.mocked(ws_1.default).mockImplementation(() => {
                setTimeout(() => {
                    mockWs.onopen?.({ type: 'open', target: mockWs });
                    setTimeout(() => {
                        mockWs.onmessage?.({ data: 'chunk' });
                    }, 5);
                }, 5);
                return mockWs;
            });
            await expect(provider.callApi('test')).rejects.toThrow('Error executing streamResponse function: Error executing streamResponse function: String transform failed');
            expect(mockWs.close).toHaveBeenCalled();
        });
        it('should reject when streamResponse string transform has syntax error', async () => {
            provider = new websocket_1.WebSocketProvider('ws://test.com', {
                config: {
                    messageTemplate: '{{ prompt }}',
                    streamResponse: 'invalid syntax here !!!',
                    transformResponse: (data) => ({ output: data.output }),
                },
            });
            jest.mocked(ws_1.default).mockImplementation(() => {
                setTimeout(() => {
                    mockWs.onopen?.({ type: 'open', target: mockWs });
                    setTimeout(() => {
                        mockWs.onmessage?.({ data: 'chunk' });
                    }, 5);
                }, 5);
                return mockWs;
            });
            await expect(provider.callApi('test')).rejects.toThrow('Error executing streamResponse function:');
            expect(mockWs.close).toHaveBeenCalled();
        });
        it('should reject when streamResponse returns invalid result format', async () => {
            const streamResponse = (_acc, _event) => {
                // Return invalid format - not an array
                return { invalid: 'format' };
            };
            provider = new websocket_1.WebSocketProvider('ws://test.com', {
                config: {
                    messageTemplate: '{{ prompt }}',
                    streamResponse,
                    transformResponse: (data) => ({ output: data.output }),
                },
            });
            jest.mocked(ws_1.default).mockImplementation(() => {
                setTimeout(() => {
                    mockWs.onopen?.({ type: 'open', target: mockWs });
                    setTimeout(() => {
                        mockWs.onmessage?.({ data: 'chunk' });
                    }, 5);
                }, 5);
                return mockWs;
            });
            await expect(provider.callApi('test')).rejects.toThrow('Error executing streamResponse function:');
            expect(mockWs.close).toHaveBeenCalled();
        });
        it('should reject when streamResponse function throws non-Error object', async () => {
            const streamResponse = (_acc, _event) => {
                throw 'String error instead of Error object';
            };
            provider = new websocket_1.WebSocketProvider('ws://test.com', {
                config: {
                    messageTemplate: '{{ prompt }}',
                    streamResponse,
                    transformResponse: (data) => ({ output: data.output }),
                },
            });
            jest.mocked(ws_1.default).mockImplementation(() => {
                setTimeout(() => {
                    mockWs.onopen?.({ type: 'open', target: mockWs });
                    setTimeout(() => {
                        mockWs.onmessage?.({ data: 'chunk' });
                    }, 5);
                }, 5);
                return mockWs;
            });
            await expect(provider.callApi('test')).rejects.toThrow('Error executing streamResponse function: Error in stream response function: String error instead of Error object');
            expect(mockWs.close).toHaveBeenCalled();
        });
    });
    describe('timeouts', () => {
        it('should timeout with streamResponse', async () => {
            provider = new websocket_1.WebSocketProvider('ws://test.com', {
                config: {
                    messageTemplate: '{{ prompt }}',
                    timeoutMs: 100,
                    // never signal completion; ensures timeout path is exercised
                    streamResponse: (acc, _data) => [acc, ''],
                },
            });
            await expect(provider.callApi('timeout test')).rejects.toThrow('WebSocket request timed out');
            expect(mockWs.close).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=websocket.test.js.map