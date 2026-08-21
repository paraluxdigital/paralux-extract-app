import 'dotenv/config';
import { app } from './index.js';

const PORT = parseInt(process.env.PORT || '5001', 10);

app.listen(PORT, () => {
  console.log(`\n==========================================================`);
  console.log(`⚡ Paralux Extract Backend — Local Server Running`);
  console.log(`📡 URL:          http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📄 Extract API:  http://localhost:${PORT}/extract`);
  console.log(`🔑 Mode 1 Model: ${process.env.GEMINI_MODE_1_MODEL || 'gemini-3.5-flash-lite'}`);
  console.log(`🧠 Mode 2 Model: ${process.env.GEMINI_MODE_2_MODEL || 'gemini-3.7-flash'}`);
  console.log(`==========================================================\n`);
});
