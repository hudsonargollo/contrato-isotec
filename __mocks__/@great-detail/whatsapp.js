// Manual mock for @great-detail/whatsapp
export class Client {
  constructor(config) {
    this.config = config;
    this.message = {
      createMessage: jest.fn().mockResolvedValue({
        messages: [{ id: 'mock-message-id-123' }],
        contacts: [{ input: '5511999999999', wa_id: '5511999999999' }]
      })
    };
  }
}

export default Client;