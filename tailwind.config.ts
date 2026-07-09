import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'], theme: { extend: { colors: { cream:'#FFF7E8', tortilla:'#F8DDA4', orange:'#BF5700', salsa:'#D1492E', gold:'#F2B705', bean:'#3F2A1D' }, boxShadow:{ soft:'0 18px 45px rgba(63,42,29,.12)' } } }, plugins: [] };
export default config;
