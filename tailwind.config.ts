import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			rbr: {
  				navy: {
  					dark: '#001F5B',
  					DEFAULT: '#0600EF',
  					light: '#1a2d6b',
  					lighter: '#2d3f7f'
  				},
  				red: {
  					dark: '#b30000',
  					DEFAULT: '#E30118',
  					bright: '#FF1E00',
  					light: '#ff3333'
  				},
  				dark: {
  					DEFAULT: '#121212',
  					lighter: '#1c1c1c',
  					card: '#1a1a1a',
  					elevated: '#242424'
  				},
  				accent: {
  					blue: '#00D9FF',
  					yellow: '#FFD700',
  					green: '#00FF88'
  				}
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-inter)',
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			heading: [
  				'var(--font-titillium)',
  				'Titillium Web',
  				'sans-serif'
  			],
  			display: [
  				'var(--font-titillium)',
  				'Titillium Web',
  				'sans-serif'
  			],
  			mono: [
  				'var(--font-mono)',
  				'monospace'
  			]
  		},
  		fontSize: {
  			'display-xl': [
  				'4.5rem',
  				{
  					lineHeight: '1.1',
  					letterSpacing: '-0.03em',
  					fontWeight: '900'
  				}
  			],
  			'display-lg': [
  				'3.75rem',
  				{
  					lineHeight: '1.1',
  					letterSpacing: '-0.03em',
  					fontWeight: '900'
  				}
  			],
  			'display-md': [
  				'3rem',
  				{
  					lineHeight: '1.15',
  					letterSpacing: '-0.02em',
  					fontWeight: '700'
  				}
  			],
  			'display-sm': [
  				'2.25rem',
  				{
  					lineHeight: '1.2',
  					letterSpacing: '-0.02em',
  					fontWeight: '700'
  				}
  			]
  		},
  		boxShadow: {
  			'racing-sm': '0 2px 4px rgba(220, 0, 0, 0.1)',
  			'racing-md': '0 4px 12px rgba(220, 0, 0, 0.15)',
  			'racing-lg': '0 8px 24px rgba(220, 0, 0, 0.2)',
  			'racing-xl': '0 12px 40px rgba(220, 0, 0, 0.25)',
  			'racing-glow': '0 0 20px rgba(6, 0, 239, 0.3)'
  		},
  		backgroundImage: {
  			'racing-gradient': 'linear-gradient(135deg, #001F5B 0%, #0600EF 100%)',
  			'racing-red-gradient': 'linear-gradient(135deg, #b30000 0%, #FF1E00 100%)',
  			'racing-speed': 'linear-gradient(90deg, transparent 0%, #00D9FF 50%, transparent 100%)'
  		},
  		screens: {
  			xs: '475px',
  			kiosk: '1920px'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'speed-line': {
  				'0%': {
  					transform: 'translateX(-100%)',
  					opacity: '0'
  				},
  				'50%': {
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'translateX(100%)',
  					opacity: '0'
  				}
  			},
  			'pulse-glow': {
  				'0%, 100%': {
  					opacity: '1',
  					boxShadow: '0 0 20px rgba(220, 0, 0, 0.5)'
  				},
  				'50%': {
  					opacity: '0.8',
  					boxShadow: '0 0 40px rgba(220, 0, 0, 0.8)'
  				}
  			},
  			'racing-pulse': {
  				'0%, 100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				},
  				'50%': {
  					opacity: '0.8',
  					transform: 'scale(1.05)'
  				}
  			},
  			'racing-spin': {
  				from: {
  					transform: 'rotate(0deg)'
  				},
  				to: {
  					transform: 'rotate(360deg)'
  				}
  			},
  			'racing-slide-in': {
  				from: {
  					opacity: '0',
  					transform: 'translateX(-20px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			'racing-slide-up': {
  				from: {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'speed-line': 'speed-line 1s ease-in-out infinite',
  			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
  			'racing-pulse': 'racing-pulse 2s ease-in-out infinite',
  			'racing-spin': 'racing-spin 1s linear infinite',
  			'racing-slide-in': 'racing-slide-in 0.3s ease-out',
  			'racing-slide-up': 'racing-slide-up 0.3s ease-out'
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;



