<template>
	<div
		v-bind:class="{ 'v-step--sticky': isSticky }"
		class="v-step"
		:id="'v-step-' + hash"
		:ref="'v-step-' + hash"
	>
		<slot name="header">
			<div v-if="step.header" class="v-step__header">
				<div v-if="step.header.title" v-html="step.header.title"></div>
			</div>
		</slot>

		<slot name="content">
			<div class="v-step__content">
				<div v-if="step.content" v-html="step.content"></div>
				<div v-else>
					This is a demo step! The id of this step is {{ hash }} and
					it targets {{ step.target }}.
				</div>
			</div>
		</slot>

		<slot name="actions">
			<div class="v-step__buttons">
				<button
					@click.prevent="skip"
					v-if="!isLast && isButtonEnabled('buttonSkip')"
					class="v-step__button v-step__button-skip"
				>
					{{ labels.buttonSkip }}
				</button>
				<button
					@click.prevent="previousStep"
					v-if="!isFirst && isButtonEnabled('buttonPrevious')"
					class="v-step__button v-step__button-previous"
				>
					{{ labels.buttonPrevious }}
				</button>
				<button
					@click.prevent="nextStep"
					v-if="!isLast && isButtonEnabled('buttonNext')"
					class="v-step__button v-step__button-next"
				>
					{{ labels.buttonNext }}
				</button>
				<button
					@click.prevent="finish"
					v-if="isLast && isButtonEnabled('buttonStop')"
					class="v-step__button v-step__button-stop"
				>
					{{ labels.buttonStop }}
				</button>
			</div>
		</slot>

		<div
			class="v-step__arrow"
			:class="{ 'v-step__arrow--dark': step.header && step.header.title }"
			data-popper-arrow
		></div>
	</div>
</template>

<script>
import { createPopper } from "@popperjs/core";
import jump from "jump.js";
import sum from "hash-sum";
import { DEFAULT_STEP_OPTIONS, HIGHLIGHT } from "../shared/constants";

export default {
	name: "v-step",
	props: {
		step: {
			type: Object
		},
		previousStep: {
			type: Function
		},
		nextStep: {
			type: Function
		},
		stop: {
			type: Function
		},
		skip: {
			type: Function,
			default: function() {
				this.stop();
			}
		},
		finish: {
			type: Function,
			default: function() {
				this.stop();
			}
		},
		isFirst: {
			type: Boolean
		},
		isLast: {
			type: Boolean
		},
		labels: {
			type: Object
		},
		enabledButtons: {
			type: Object
		},
		highlight: {
			type: Boolean
		},
		stopOnFail: {
			type: Boolean
		},
		debug: {
			type: Boolean
		},
		ionic: {
			type: Boolean
		},
		container: {
			type: String,
			default: "bodyyyy2"
		},
		insertPosition: {
			type: String,
			default: "inside",
			validator: value => ["before", "inside", "after"].includes(value)
		}
	},
	created() {
		// Component lifecycle initialization
	},
	data() {
		return {
			hash: sum(this.step.target),
			targetElement: null
		};
	},
	computed: {
		params() {
			return {
				...DEFAULT_STEP_OPTIONS,
				...{ highlight: this.highlight }, // Use global tour highlight setting first
				...{ enabledButtons: Object.assign({}, this.enabledButtons) },
				...this.step.params // Then use local step parameters if defined
			};
		},
		/**
		 * A step is considered sticky if it has no target.
		 */
		isSticky() {
			return !this.step.target;
		},
		/**
		 * Get the container element where the tour should be appended.
		 * This is a computed property to ensure reactivity when container prop changes.
		 */
		containerElement() {
			if (!this.container || this.container === "body") {
				return document.body;
			}

			const foundContainer = document.querySelector(this.container);

			if (!foundContainer) {
				console.warn(
					`[Vue Tour] Container "${this.container}" not found, falling back to body`
				);
				return document.body;
			}

			return foundContainer;
		},
		/**
		 * Get the target element, searching within the container scope.
		 */
		resolvedTargetElement() {
			if (!this.step.target) return null;

			// Search within the container scope first
			const containerEl = this.containerElement;
			let targetEl = null;

			if (containerEl !== document.body) {
				targetEl = containerEl.querySelector(this.step.target);
			}

			// Fall back to global search if not found in container
			if (!targetEl) {
				targetEl = document.querySelector(this.step.target);
			}

			return this.step.parent ? targetEl?.parentElement : targetEl;
		}
	},
	methods: {
		insertStepIntoContainer(stepElement) {
			const containerEl = this.containerElement;
			const position = this.insertPosition;

			if (position === "before") {
				// Insertar ANTES del container
				if (containerEl && containerEl.parentNode) {
					containerEl.parentNode.insertBefore(
						stepElement,
						containerEl
					);
					return;
				}
			} else if (position === "after") {
				// Insertar DESPUÉS del container
				if (containerEl && containerEl.parentNode) {
					containerEl.parentNode.insertBefore(
						stepElement,
						containerEl.nextSibling
					);
					return;
				}
			}

			// Default: insertar DENTRO del container (inside)
			containerEl.appendChild(stepElement);
		},
		createStep() {
			if (this.debug) {
				console.log(
					"[VStep] createStep called for target:",
					this.step.target
				);
			}

			// Check if this is a sticky step (no target)
			if (!this.step.target) {
				if (this.debug) {
					console.log(
						"[VStep] This is a sticky step (no target) - will be centered on screen"
					);
				}
			}

			// Use computed containerElement property
			const containerEl = this.containerElement;

			if (this.step.target) {
				if (this.debug) {
					console.log(
						"[VStep] Searching for target element:",
						this.step.target
					);
					console.log(
						"[VStep] Elements available in container:",
						Array.from(containerEl.querySelectorAll("*[id]")).map(
							el => "#" + el.id
						)
					);
				}

				let targetEl = null;

				// First try to find within the container
				if (containerEl !== document.body) {
					targetEl = containerEl.querySelector(this.step.target);
				}

				// Fall back to global search if not found
				if (!targetEl) {
					targetEl = document.querySelector(this.step.target);
				}

				this.targetElement = this.step.parent
					? targetEl?.parentElement
					: targetEl;
			} else {
				if (this.debug) {
					console.log(
						"[DEBUG] [VStep] No target specified, setting to null"
					);
				}
				this.targetElement = null;
			}

			if (this.debug)
				console.log(
					"[Vue Tour] The target element " +
						this.step.target +
						' of .v-step[id="' +
						this.hash +
						'"] is:',
					this.targetElement
				);

			if (this.isSticky) {
				this.insertStepIntoContainer(this.$refs["v-step-" + this.hash]);
			} else {
				if (this.targetElement) {
					this.enableScrolling();
					this.createHighlight();

					createPopper(
						this.targetElement,
						this.$refs["v-step-" + this.hash],
						this.params
					);
				} else {
					if (this.debug)
						console.error(
							"[Vue Tour] The target element " +
								this.step.target +
								' of .v-step[id="' +
								this.hash +
								'"] does not exist!'
						);
					this.$emit("targetNotFound", this.step);
					this.stopOnFail ? this.stop() : this.nextStep();
				}
			}
		},
		enableScrolling() {
			if (this.params.enableScrolling) {
				if (this.step.duration || this.step.offset) {
					let jumpOptions = {
						duration: this.step.duration || 1000,
						offset: this.step.offset || 0,
						callback: undefined,
						a11y: false
					};

					!this.ionic
						? jump(this.targetElement, jumpOptions)
						: this.ionicScroll(jumpOptions);
				} else {
					// Use the native scroll by default if no scroll options has been defined
					this.targetElement.scrollIntoView({ behavior: "smooth" });
				}
			}
		},
		isHighlightEnabled() {
			return this.params.highlight;
		},
		createHighlight() {
			if (this.isHighlightEnabled() && this.targetElement) {
				this.containerElement.classList.add(HIGHLIGHT.classes.active);
				const transitionValue = window
					.getComputedStyle(this.targetElement)
					.getPropertyValue("transition");

				// Make sure our background doesn't flick on transitions
				if (transitionValue !== "all 0s ease 0s") {
					this.targetElement.style.transition = `${transitionValue}, ${HIGHLIGHT.transition}`;
				}

				this.targetElement.classList.add(
					HIGHLIGHT.classes.targetHighlighted
				);
				// The element must have a position, if it doesn't have one, add a relative position class
				if (!this.targetElement.style.position) {
					this.targetElement.classList.add(
						HIGHLIGHT.classes.targetRelative
					);
				}
			} else {
				this.containerElement.classList.remove(
					HIGHLIGHT.classes.active
				);
			}
		},
		removeHighlight() {
			if (this.isHighlightEnabled() && this.targetElement) {
				const target = this.targetElement;
				const currentTransition = this.targetElement.style.transition;
				this.targetElement.classList.remove(
					HIGHLIGHT.classes.targetHighlighted
				);
				this.targetElement.classList.remove(
					HIGHLIGHT.classes.targetRelative
				);
				// Remove our transition when step is finished.
				if (currentTransition.includes(HIGHLIGHT.transition)) {
					setTimeout(() => {
						target.style.transition = currentTransition.replace(
							`, ${HIGHLIGHT.transition}`,
							""
						);
					}, 0);
				}
			}
		},
		isButtonEnabled(name) {
			return this.params.enabledButtons.hasOwnProperty(name)
				? this.params.enabledButtons[name]
				: true;
		},
		getOffset(jumpOptions) {
			const elemRect = this.targetElement.getBoundingClientRect();
			let offset = elemRect.top;
			if (jumpOptions.offset) {
				offset += jumpOptions.offset;
			}

			return offset;
		},
		getIonContent() {
			const pages = document.getElementsByClassName("ion-page");
			if (pages.length) {
				const elByZIndexes = {};
				for (const el of pages) {
					const styles = window.getComputedStyle(el);
					elByZIndexes[styles["z-index"]] = el.querySelector(
						"ion-content"
					);
				}

				const maxZIndex = Math.max(
					...Object.keys(elByZIndexes).map(value => +value)
				);
				return {
					el: elByZIndexes[maxZIndex],
					pages: Object.keys(elByZIndexes).length
				};
			}
		},
		ionicScroll(jumpOptions) {
			const offset = this.getOffset(jumpOptions);
			this.getIonContent().el.scrollByPoint(
				0,
				offset,
				this.step.duration || 1000
			);
		}
	},
	mounted() {
		this.createStep();
	},
	unmounted() {
		this.removeHighlight();
	}
};
</script>

<style lang="scss" scoped>
.v-step {
	background: #50596c; /* #ffc107, #35495e */
	color: white;
	max-width: 320px;
	border-radius: 3px;
	box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px,
		rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px,
		rgba(0, 0, 0, 0.06) 0px 2px 4px -1px;
	padding: 1rem;
	pointer-events: auto;
	text-align: center;
	z-index: 10000;

	&--sticky {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		& .v-step__arrow {
			display: none;
		}
	}
}

.v-step__arrow,
.v-step__arrow::before {
	position: absolute;
	width: 10px;
	height: 10px;
	background: inherit;
}

.v-step__arrow {
	visibility: hidden;

	&--dark {
		&:before {
			background: #454d5d;
		}
	}
}

.v-step__arrow::before {
	visibility: visible;
	content: "";
	transform: rotate(45deg);
	margin-left: -5px;
}

.v-step[data-popper-placement^="top"] > .v-step__arrow {
	bottom: -5px;
}

.v-step[data-popper-placement^="bottom"] > .v-step__arrow {
	top: -5px;
}

.v-step[data-popper-placement^="right"] > .v-step__arrow {
	left: -5px;
}

.v-step[data-popper-placement^="left"] > .v-step__arrow {
	right: -5px;
}

/* Custom */

.v-step__header {
	margin: -1rem -1rem 0.5rem;
	padding: 0.5rem;
	background-color: #454d5d;
	border-top-left-radius: 3px;
	border-top-right-radius: 3px;
}

.v-step__content {
	margin: 0 0 1rem 0;
}

.v-step__button {
	background: transparent;
	border: 0.05rem solid white;
	border-radius: 0.1rem;
	color: white;
	cursor: pointer;
	display: inline-block;
	font-size: 0.8rem;
	height: 1.8rem;
	line-height: 1rem;
	outline: none;
	margin: 0 0.2rem;
	padding: 0.35rem 0.4rem;
	text-align: center;
	text-decoration: none;
	transition: all 0.2s ease;
	vertical-align: middle;
	white-space: nowrap;

	&:hover {
		background-color: rgba(white, 0.95);
		color: #50596c;
	}
}
</style>
