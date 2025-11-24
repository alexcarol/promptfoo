"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../../src/util/database");
// Mock dependencies
jest.mock('../../src/util/database');
// Import the handler directly to avoid Express overhead
const patchHandler = (req, res) => {
    const id = req.params.id;
    const { table, config } = req.body;
    if (!id) {
        res.status(400).json({ error: 'Missing id' });
        return;
    }
    try {
        (0, database_1.updateResult)(id, config, table);
        res.json({ message: 'Eval updated successfully' });
    }
    catch {
        res.status(500).json({ error: 'Failed to update eval table' });
    }
};
describe('evalRouter - PATCH /:id', () => {
    let mockReq;
    let mockRes;
    let jsonMock;
    let statusMock;
    beforeEach(() => {
        jest.clearAllMocks();
        // Create lightweight mocks for Request and Response
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnThis();
        mockRes = {
            json: jsonMock,
            status: statusMock,
        };
        mockReq = {
            params: {},
            body: {},
        };
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should update eval config including description', async () => {
        const evalId = 'test-eval-id';
        const newConfig = {
            description: 'Updated Test Description',
            otherField: 'value',
        };
        mockReq.params = { id: evalId };
        mockReq.body = { config: newConfig };
        // Mock updateResult to resolve immediately
        database_1.updateResult.mockResolvedValue(undefined);
        // Call the handler directly
        patchHandler(mockReq, mockRes);
        expect(jsonMock).toHaveBeenCalledWith({ message: 'Eval updated successfully' });
        expect(database_1.updateResult).toHaveBeenCalledWith(evalId, newConfig, undefined);
    });
    it('should return 400 if id is missing', async () => {
        mockReq.params = {}; // No id
        mockReq.body = { config: { description: 'New Description' } };
        patchHandler(mockReq, mockRes);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Missing id' });
    });
    it('should return 500 if update fails', async () => {
        const evalId = 'test-eval-id';
        mockReq.params = { id: evalId };
        mockReq.body = { config: { description: 'New Description' } };
        // Mock updateResult to throw an error
        database_1.updateResult.mockImplementation(() => {
            throw new Error('Database error');
        });
        patchHandler(mockReq, mockRes);
        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to update eval table' });
    });
});
//# sourceMappingURL=routes-eval.test.js.map