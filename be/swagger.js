const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Home IoT API',
      version: '1.0.0',
      description: 'Tài liệu API cho hệ thống Smart Home IoT tích hợp MQTT Data & Actions',
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
