<template>
	<div
		v-if="forceMask || (rect.width && rect.height)"
		class="v-spotlight-mask"
	>
		<div
			class="v-spotlight-blocker v-spotlight-blocker--top"
			:style="blockerTopStyle"
		></div>
		<div
			class="v-spotlight-blocker v-spotlight-blocker--left"
			:style="blockerLeftStyle"
		></div>
		<div
			class="v-spotlight-blocker v-spotlight-blocker--right"
			:style="blockerRightStyle"
		></div>
		<div
			class="v-spotlight-blocker v-spotlight-blocker--bottom"
			:style="blockerBottomStyle"
		></div>
		<div class="v-spotlight-overlay" :style="overlayStyle"></div>
	</div>
</template>

<script>
import sum from "hash-sum";

export default {
	name: "VSpotlightMask",
	props: {
		targetSelector: { type: String, required: false },
		padding: { type: Number, required: false },
		opacity: { type: Number, default: 0.7 },
		borderRadius: { type: [Number, String], required: false },
		zIndex: { type: Number, default: 9998 },
		editable: { type: Boolean, default: false },
		forceMask: { type: Boolean, default: false },
		debug: { type: Boolean }
	},
	data() {
		return {
			rect: { top: 0, left: 0, width: 0, height: 0 },
			hash: sum(this.targetSelector || ""),
			resizeListenerId: null,
			mutationObserver: null,
			intersectionObserver: null,
			scrollCleanup: null,
			lastTarget: null
		};
	},
	computed: {
		overlayStyle() {
			const shadowColor = `rgba(0, 0, 0, ${this.opacity})`;

			if (this.forceMask) {
				const style = {
					position: "fixed",
					top: "0",
					left: "0",
					width: "100vw",
					height: "100vh",
					zIndex: this.zIndex,
					boxShadow: `inset 0 0 0 9999px ${shadowColor}`,
					...(this.borderRadius !== undefined && {
						borderRadius: `${this.borderRadius}px`
					}),
					transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
					pointerEvents: "auto"
				};
				return style;
			}

			// Spotlight over target.
			const padding = this.padding || 0;
			const x = this.rect.left - padding;
			const y = this.rect.top - padding;
			const w = this.rect.width + padding * 2;
			const h = this.rect.height + padding * 2;

			const finalBorderRadius = this.getFinalBorderRadius();

			return {
				position: "fixed",
				width: `${w}px`,
				height: `${h}px`,
				top: "0",
				left: "0",
				zIndex: this.zIndex,
				transform: `translate(${x}px, ${y}px)`,
				boxShadow: `0 0 0 9999px ${shadowColor}`,
				...(finalBorderRadius !== undefined && {
					borderRadius: finalBorderRadius
				}),
				transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
				pointerEvents: this.editable ? "none" : "auto"
			};
		},
		blockerTopStyle() {
			const padding = this.padding || 0;
			return {
				top: 0,
				left: 0,
				width: "100vw",
				height: `${this.rect.top - padding}px`,
				zIndex: this.zIndex - 1
			};
		},
		blockerLeftStyle() {
			const padding = this.padding || 0;
			return {
				top: `${this.rect.top - padding}px`,
				left: 0,
				width: `${this.rect.left - padding}px`,
				height: `${this.rect.height + padding * 2}px`,
				zIndex: this.zIndex - 1
			};
		},
		blockerRightStyle() {
			const padding = this.padding || 0;
			return {
				top: `${this.rect.top - padding}px`,
				left: `${this.rect.left + this.rect.width + padding}px`,
				width: `calc(100vw - ${this.rect.left +
					this.rect.width +
					padding}px)`,
				height: `${this.rect.height + padding * 2}px`,
				zIndex: this.zIndex - 1
			};
		},
		blockerBottomStyle() {
			const padding = this.padding || 0;
			return {
				top: `${this.rect.top + this.rect.height + padding}px`,
				left: 0,
				width: "100vw",
				height: `calc(100vh - ${this.rect.top +
					this.rect.height +
					padding}px)`,
				zIndex: this.zIndex - 1
			};
		}
	},
	watch: {
		targetSelector: {
			handler() {
				if (this.targetSelector) {
					this.$nextTick(this.updateRect);
					this.observeTarget();
				}
			},
			immediate: true
		}
	},
	mounted() {
		this.resizeListenerId = this.updateRect.bind(this);
		window.addEventListener("resize", this.resizeListenerId);
		this.updateRect();
		this.observeTarget();
	},
	beforeUnmount() {
		window.removeEventListener("resize", this.resizeListenerId);
		if (this.mutationObserver) {
			this.mutationObserver.disconnect();
			this.mutationObserver = null;
		}
		if (this.intersectionObserver) {
			this.intersectionObserver.disconnect();
			this.intersectionObserver = null;
		}
		if (this.scrollCleanup) {
			this.scrollCleanup();
			this.scrollCleanup = null;
		}
	},
	methods: {
		updateRect() {
			const tryFindTarget = (attempt = 0) => {
				let el = document.querySelector(this.targetSelector);
				if (el && el.offsetParent === null) {
					const candidates = Array.from(
						document.querySelectorAll(this.targetSelector)
					);
					el = candidates.find(e => e.offsetParent !== null) || el;
				}
				if (el) {
					this.rect = el.getBoundingClientRect();
					this.lastTarget = el;
				} else if (attempt < 10) {
					setTimeout(() => tryFindTarget(attempt + 1), 100);
				} else {
					this.rect = { top: 0, left: 0, width: 0, height: 0 };
					this.lastTarget = null;
				}
			};
			tryFindTarget();
		},
		observeTarget() {
			// Disconnect previous observer.
			if (this.mutationObserver) {
				this.mutationObserver.disconnect();
				this.mutationObserver = null;
			}
			if (this.intersectionObserver) {
				this.intersectionObserver.disconnect();
				this.intersectionObserver = null;
			}
			if (this.scrollCleanup) {
				this.scrollCleanup();
				this.scrollCleanup = null;
			}

			const el = document.querySelector(this.targetSelector);
			if (!el) return;

			// 1. MutationObserver - Observe changes in attributes, subtree, and childList.
			this.mutationObserver = new MutationObserver(() => {
				this.updateRect();
			});
			this.mutationObserver.observe(el, {
				attributes: true,
				childList: true,
				subtree: true
			});

			// 2. IntersectionObserver - Detect when element moves (like Popper's autoUpdate).
			this.intersectionObserver = new IntersectionObserver(
				() => {
					this.updateRect();
				},
				{
					threshold: [0, 1]
				}
			);
			this.intersectionObserver.observe(el);

			// 3. Scroll listeners on all ancestors (like Popper's autoUpdate).
			const ancestors = this.getOverflowAncestors(el);
			const scrollHandler = () => {
				this.updateRect();
			};
			ancestors.forEach(ancestor => {
				ancestor.addEventListener("scroll", scrollHandler, {
					passive: true
				});
			});
			this.scrollCleanup = () => {
				ancestors.forEach(ancestor => {
					ancestor.removeEventListener("scroll", scrollHandler);
				});
			};

			if (this.debug)
				console.log(
					"[Vue Tour] The highlight target element " +
						this.targetSelector +
						' of .v-step[id="' +
						this.hash +
						'"] is:',
					el
				);
		},
		getFinalBorderRadius() {
			// Priority 1: Use borderRadius prop if defined.
			if (this.borderRadius !== undefined) {
				// If borderRadius is a number, add 'px', or if string, use as is.
				return typeof this.borderRadius === "number"
					? `${this.borderRadius}px`
					: this.borderRadius;
			}

			// Priority 2: Get border radius from target element.
			const el = document.querySelector(this.targetSelector);
			if (!el) return undefined;

			// This gets computed styles like borderRadius, borderTopLeftRadius, etc.
			const styles = window.getComputedStyle(el);
			const elRadius = styles.borderRadius;

			// Check if borderRadius has any non-zero value.
			// borderRadius can be "0px", "5px", "32px 10px 12px 13px", etc.
			const hasRadius =
				elRadius && !elRadius.split(" ").every(val => val === "0px");

			if (hasRadius) {
				return elRadius;
			}

			// If borderRadius is all zeros, fallback to check individual corner properties.
			const topLeft = styles.borderTopLeftRadius;
			const topRight = styles.borderTopRightRadius;
			const bottomRight = styles.borderBottomRightRadius;
			const bottomLeft = styles.borderBottomLeftRadius;

			const corners = [topLeft, topRight, bottomRight, bottomLeft];
			const hasIndividualRadius = corners.some(
				val => val && val !== "0px"
			);

			if (hasIndividualRadius) {
				return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`;
			}

			return undefined;
		},
		getOverflowAncestors(element) {
			// Get all scrollable ancestors (like Popper's getOverflowAncestors)
			const ancestors = [];
			let currentElement = element.parentElement;

			while (currentElement) {
				const styles = window.getComputedStyle(currentElement);
				const overflow =
					styles.overflow + styles.overflowX + styles.overflowY;

				if (/(auto|scroll)/.test(overflow)) {
					ancestors.push(currentElement);
				}

				currentElement = currentElement.parentElement;
			}

			// Always include window for viewport scrolling
			ancestors.push(window);

			return ancestors;
		}
	}
};
</script>

<style scoped>
.v-spotlight-blocker {
	position: fixed;
	background: transparent;
	pointer-events: auto;
}
</style>
