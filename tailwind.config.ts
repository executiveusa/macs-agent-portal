import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		screens: {
			'xs': '320px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
			'3xl': '1920px',
			'4xl': '2560px',
		},
		container: {
			center: true,
			padding: {
				'xs': '1rem',
				'sm': '1.5rem',
				'md': '2rem',
				'lg': '2.5rem',
				'xl': '3rem',
				'2xl': '4rem',
			},
			screens: {
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1536px',
				'3xl': '1920px',
				'4xl': '2560px',
			}
		},
		extend: {
			spacing: {
				'safe-top': 'max(1rem, env(safe-area-inset-top))',
				'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
				'safe-left': 'max(1rem, env(safe-area-inset-left))',
				'safe-right': 'max(1rem, env(safe-area-inset-right))',
			},
			fontSize: {
				'xs': ['clamp(0.75rem, 2vw, 0.875rem)', { lineHeight: '1.5rem' }],
				'sm': ['clamp(0.875rem, 2vw, 1rem)', { lineHeight: '1.5rem' }],
				'base': ['clamp(1rem, 2.5vw, 1.125rem)', { lineHeight: '1.75rem' }],
				'lg': ['clamp(1.125rem, 2.5vw, 1.25rem)', { lineHeight: '1.75rem' }],
				'xl': ['clamp(1.25rem, 3vw, 1.5rem)', { lineHeight: '2rem' }],
				'2xl': ['clamp(1.5rem, 3.5vw, 1.875rem)', { lineHeight: '2.25rem' }],
				'3xl': ['clamp(1.875rem, 4vw, 2.25rem)', { lineHeight: '2.5rem' }],
				'4xl': ['clamp(2.25rem, 5vw, 3rem)', { lineHeight: '3.5rem' }],
			},
			padding: {
				'xs': 'clamp(0.5rem, 3vw, 1rem)',
				'sm': 'clamp(0.75rem, 3vw, 1.25rem)',
				'md': 'clamp(1rem, 4vw, 1.5rem)',
				'lg': 'clamp(1.5rem, 4vw, 2rem)',
				'xl': 'clamp(2rem, 5vw, 3rem)',
			},
			gap: {
				'xs': 'clamp(0.5rem, 2vw, 0.75rem)',
				'sm': 'clamp(0.75rem, 2vw, 1rem)',
				'md': 'clamp(1rem, 3vw, 1.5rem)',
				'lg': 'clamp(1.5rem, 3vw, 2rem)',
				'xl': 'clamp(2rem, 4vw, 3rem)',
			},
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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				maxx: {
					bg: '#05070a',
					secondary: '#11151b',
					cyan: '#46d5ff',
					orange: '#ff7a3c',
					paper: '#f3e0c0',
					ink: '#1b1209'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				// Accordion
				'accordion-down': {
					from: { height: '0', opacity: '0' },
					to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
					to: { height: '0', opacity: '0' }
				},
				// Fades
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-out': {
					'0%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0', transform: 'translateY(10px)' }
				},
				// Scale
				'scale-in': {
					'0%': { transform: 'scale(0.96)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'scale-out': {
					from: { transform: 'scale(1)', opacity: '1' },
					to: { transform: 'scale(0.96)', opacity: '0' }
				},
				// Slide
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-out-right': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(100%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.25s ease-out',
				'accordion-up': 'accordion-up 0.25s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'scale-out': 'scale-out 0.2s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'slide-out-right': 'slide-out-right 0.3s ease-out',
				enter: 'fade-in 0.3s ease-out, scale-in 0.2s ease-out',
				exit: 'fade-out 0.3s ease-out, scale-out 0.2s ease-out'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
