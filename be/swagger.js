const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IOT Dashboard API',
      version: '1.0.0',
      description: 'Tài liệu API cho IOT Dashboard tích hợp Smart Home MQTT Data & Actions',
      contact: {
        name: 'Lê Xuân Trường',
        email: 'b22dcpt300@stu.ptit.edu.vn',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
  },
  // Đường dẫn đến các file chứa custom jsdoc API 
  apis: ['./routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
