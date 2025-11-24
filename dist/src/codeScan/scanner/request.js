"use strict";
/**
 * Scan Request Building and Execution
 *
 * Handles building scan requests and executing them via Socket.IO.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildScanRequest = buildScanRequest;
exports.executeScanRequest = executeScanRequest;
/**
 * Build scan request from inputs
 *
 * @param files - Files to scan
 * @param metadata - Git metadata
 * @param config - Scan configuration
 * @param sessionId - Session ID for scan tracking and cancellation
 * @param pullRequest - Optional PR context
 * @param guidance - Optional custom guidance
 * @returns Scan request object
 */
function buildScanRequest(files, metadata, config, sessionId, pullRequest, guidance) {
    return {
        files,
        metadata,
        config: {
            minimumSeverity: config.minimumSeverity,
            diffsOnly: config.diffsOnly,
            guidance,
        },
        sessionId, // Always included for scan tracking and cancellation
        pullRequest, // Include PR context if --github-pr flag provided
    };
}
/**
 * Execute scan request via Socket.IO
 *
 * @param socket - Connected Socket.IO socket
 * @param request - Scan request to send
 * @param options - Execution options
 * @returns Promise resolving to scan response
 * @throws Error if scan fails, connection lost, or user cancels
 */
async function executeScanRequest(socket, request, options) {
    const { showSpinner, spinner, abortController } = options;
    // Update spinner
    if (showSpinner && spinner) {
        spinner.text = 'Scanning...';
    }
    // Add heartbeat to show progress during long scans
    let heartbeatInterval;
    let firstPulseTimeout;
    if (showSpinner && spinner) {
        const pulse = () => {
            // Show "Still scanning..." for 4 seconds
            spinner.text = 'Still scanning...';
            setTimeout(() => {
                if (spinner?.isSpinning) {
                    spinner.text = 'Scanning...';
                }
            }, 4000);
        };
        // First pulse at 8 seconds
        firstPulseTimeout = setTimeout(() => {
            pulse();
            // Then pulse every 12 seconds (8s "Scanning..." + 4s "Still scanning...")
            heartbeatInterval = setInterval(pulse, 12000);
        }, 8000);
    }
    // Send scan request and wait for response
    const scanResponse = await new Promise((resolve, reject) => {
        // Set up event listeners
        const onComplete = (response) => {
            socket?.off('scan:complete', onComplete);
            socket?.off('scan:error', onError);
            socket?.off('reconnect_failed', onReconnectFailed);
            abortController.signal.removeEventListener('abort', onAbort);
            if (firstPulseTimeout) {
                clearTimeout(firstPulseTimeout);
            }
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            resolve(response);
        };
        const onError = (error) => {
            socket?.off('scan:complete', onComplete);
            socket?.off('scan:error', onError);
            socket?.off('reconnect_failed', onReconnectFailed);
            abortController.signal.removeEventListener('abort', onAbort);
            if (firstPulseTimeout) {
                clearTimeout(firstPulseTimeout);
            }
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            reject(new Error(error.message || error.error));
        };
        const onReconnectFailed = () => {
            socket?.off('scan:complete', onComplete);
            socket?.off('scan:error', onError);
            socket?.off('reconnect_failed', onReconnectFailed);
            abortController.signal.removeEventListener('abort', onAbort);
            if (firstPulseTimeout) {
                clearTimeout(firstPulseTimeout);
            }
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            reject(new Error('Lost connection to server during scan'));
        };
        const onAbort = () => {
            // Emit cancellation to server
            socket?.emit('scan:cancel');
            // Remove listeners
            socket?.off('scan:complete', onComplete);
            socket?.off('scan:error', onError);
            socket?.off('reconnect_failed', onReconnectFailed);
            abortController.signal.removeEventListener('abort', onAbort);
            if (firstPulseTimeout) {
                clearTimeout(firstPulseTimeout);
            }
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            reject(new Error('cancelled by user'));
        };
        socket?.on('scan:complete', onComplete);
        socket?.on('scan:error', onError);
        socket?.on('reconnect_failed', onReconnectFailed);
        abortController.signal.addEventListener('abort', onAbort);
        // Emit scan request
        socket?.emit('scan:start', request);
    });
    return scanResponse;
}
//# sourceMappingURL=request.js.map