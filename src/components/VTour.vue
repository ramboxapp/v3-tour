<template>
	<div class="v-tour">
		<slot
			name="spotlight-mask"
			:current-step="currentStep"
			:target-selector="highlightConfig.target"
			:padding="highlightConfig.padding"
			:opacity="highlightConfig.opacity"
			:border-radius="highlightConfig.radius"
			:z-index="highlightConfig.zIndex"
			:editable="step?.editable"
			:force-mask="step?.forceMask"
			:debug="customOptions.debug"
			:is-processing="isProcessing"
		>
			<transition name="fade">
				<v-spotlight-mask
					v-if="steps[currentStep] && highlightReady && !isProcessing"
					:target-selector="highlightConfig.target"
					:padding="highlightConfig.padding"
					:opacity="highlightConfig.opacity"
					:border-radius="highlightConfig.radius"
					:z-index="highlightConfig.zIndex"
					:editable="step.editable"
					:force-mask="step.forceMask"
					:debug="customOptions.debug"
				/>
			</transition>
		</slot>
		<slot
			:current-step="currentStep"
			:steps="steps"
			:previous-step="previousStep"
			:next-step="nextStep"
			:stop="stop"
			:skip="skip"
			:finish="finish"
			:is-first="isFirst"
			:is-last="isLast"
			:labels="customOptions.labels"
			:enabled-buttons="customOptions.enabledButtons"
			:highlight="customOptions.highlight"
			:debug="customOptions.debug"
			:container="'#app'"
			:insert-position="customOptions.insertPosition"
			:is-processing="isProcessing"
			:handle-next="handleNext"
			:handle-previous="handlePrevious"
			:handle-skip="handleSkip"
			:handle-finish="handleFinish"
		>
			<!--Default slot {{ currentStep }}-->
			<v-step
				v-if="steps[currentStep]"
				:step="steps[currentStep]"
				:key="currentStep + '-' + customOptions.container"
				:previous-step="previousStep"
				:next-step="nextStep"
				:stop="stop"
				:skip="skip"
				:finish="finish"
				:is-first="isFirst"
				:is-last="isLast"
				:labels="customOptions.labels"
				:enabled-buttons="customOptions.enabledButtons"
				:highlight="customOptions.highlight"
				:stop-on-fail="customOptions.stopOnTargetNotFound"
				:debug="customOptions.debug"
				:ionic="customOptions.ionic"
				:container="'#app'"
				:insert-position="customOptions.insertPosition"
				:is-processing="isProcessing"
				@targetNotFound="$emit('targetNotFound', $event)"
				@readyForHighlight="highlightReady = true"
				:handleNext="handleNext"
				:handlePrevious="handlePrevious"
				:handleSkip="handleSkip"
				:handleFinish="handleFinish"
			/>
		</slot>
	</div>
</template>

<script>
import { DEFAULT_CALLBACKS, DEFAULT_OPTIONS, KEYS } from "../shared/constants";
import VStep from "./VStep.vue";
import VSpotlightMask from "./VSpotlightMask.vue";

export default {
	name: "v-tour",
	components: {
		VStep,
		VSpotlightMask
	},
	props: {
		steps: {
			type: Array,
			default: () => []
		},
		name: {
			type: String
		},
		options: {
			type: Object,
			default: () => {
				return DEFAULT_OPTIONS;
			}
		},
		callbacks: {
			type: Object,
			default: () => {
				return DEFAULT_CALLBACKS;
			}
		}
	},
	created() {
		this.$tours[this.name] = this;
	},
	data() {
		return {
			currentStep: -1,
			isProcessing: false,
			highlightReady: false
		};
	},
	mounted() {
		this.$tours[this.name] = this;
	},
	beforeUnmount() {
		// Remove the keyup listener if it has been defined.
		if (this.customOptions.useKeyboardNavigation) {
			window.removeEventListener("keyup", this.handleKeyup);
		}
	},
	computed: {
		// Allow us to define custom options and merge them with the default options.
		// Since options is a computed property, it is reactive and can be updated during runtime.
		customOptions() {
			return {
				...DEFAULT_OPTIONS,
				...this.options
			};
		},
		customCallbacks() {
			return {
				...DEFAULT_CALLBACKS,
				...this.callbacks
			};
		},
		// Get the highlight configuration for the current step.
		// Returns an object with all highlight properties (target, padding, opacity, etc.).
		highlightConfig() {
			if (!this.isRunning) return {};

			const stepHighlight = this.step.highlight;

			// If highlight is a boolean or undefined, return default config
			if (typeof stepHighlight !== "object" || stepHighlight === null) {
				return {
					target: this.step.target,
					padding: undefined,
					opacity: undefined,
					radius: undefined,
					zIndex: undefined
				};
			}

			// If highlight is an object, merge with step.target as fallback
			return {
				target: stepHighlight.target ?? this.step.target,
				padding: stepHighlight.padding,
				opacity: stepHighlight.opacity,
				radius: stepHighlight.radius,
				zIndex: stepHighlight.zIndex
			};
		},
		// Return true if the tour is active, which means that there's a VStep displayed.
		isRunning() {
			return (
				this.currentStep > -1 && this.currentStep < this.numberOfSteps
			);
		},
		isFirst() {
			return this.currentStep === 0;
		},
		isLast() {
			return this.currentStep === this.steps.length - 1;
		},
		numberOfSteps() {
			return this.steps.length;
		},
		step() {
			return this.steps[this.currentStep];
		}
	},
	methods: {
		async goToStep(targetStep, type, force = false) {
			// Jump to specific step, triggering its before callback if defined.
			// force parameter allows to bypass isProcessing check, useful when called from "before" or tour buttons already wrapped in isProcessing checks.
			if (
				typeof targetStep !== "number" ||
				targetStep < 0 ||
				targetStep >= this.steps.length
			)
				return;

			if (
				this.customOptions.preventMultipleActions &&
				this.isProcessing &&
				!force
			) {
				if (this.customOptions.debug) {
					console.log(
						"[Vue Tour] goToStep blocked - already in progress"
					);
				}
				return Promise.resolve();
			}
			this.isProcessing = true;
			try {
				let step = this.steps[targetStep];
				if (typeof step.before !== "undefined") {
					try {
						await step.before(type);
					} catch (e) {
						this.isProcessing = false;
						return Promise.reject(e);
					}
				}
				this.isProcessing = false;
				let process = () =>
					new Promise((resolve, reject) => {
						this.highlightReady = false;
						this.currentStep = targetStep;
						resolve();
					});
				await process();
				return Promise.resolve();
			} catch (error) {
				this.isProcessing = false;
				throw error;
			}
		},
		async executeNavigationAction(action) {
			// Allow disabling this feature via options.
			if (!this.customOptions.preventMultipleActions) {
				return action();
			}

			// If already processing, ignore the action.
			if (this.isProcessing) {
				if (this.customOptions.debug) {
					console.log(
						"[Vue Tour] Navigation blocked - action already in progress"
					);
				}
				return Promise.resolve();
			}

			this.isProcessing = true;
			try {
				await action();
			} catch (error) {
				if (this.customOptions.debug) {
					console.error("[Vue Tour] Navigation error:", error);
				}
				this.isProcessing = false;
				throw error;
			}
		},
		async start(startStep) {
			return this.executeNavigationAction(async () => {
				// Register keyup listeners for this tour.
				if (this.customOptions.useKeyboardNavigation) {
					window.addEventListener("keyup", this.handleKeyup);
				}

				// Wait for the DOM to be loaded, then start the tour.
				startStep =
					typeof startStep !== "undefined"
						? parseInt(startStep, 10)
						: 0;
				let step = this.steps[startStep];

				if (typeof step.before !== "undefined") {
					try {
						await step.before("start");
					} catch (e) {
						return Promise.reject(e);
					}
				}

				// Reset isProcessing before changing currentStep so the new step renders with buttons enabled.
				this.isProcessing = false;

				let process = () =>
					new Promise((resolve, reject) => {
						setTimeout(() => {
							this.highlightReady = false;
							this.customCallbacks.onStart();
							this.currentStep = startStep;
							resolve();
						}, this.customOptions.startTimeout);
					});

				await process();

				return Promise.resolve();
			});
		},
		async previousStep() {
			// If isProcessing is already active, we're being called from a wrapped custom action.
			const wasProcessing = this.isProcessing;

			// Only activate isProcessing if it wasn't already active.
			if (!wasProcessing && this.customOptions.preventMultipleActions) {
				if (this.isProcessing) {
					if (this.customOptions.debug) {
						console.log(
							"[Vue Tour] previousStep blocked - already in progress"
						);
					}
					return Promise.resolve();
				}
				this.isProcessing = true;
			}

			try {
				let futureStep = this.currentStep - 1;

				if (futureStep > -1) {
					let step = this.steps[futureStep];
					if (typeof step.before !== "undefined") {
						try {
							await step.before("previous");
						} catch (e) {
							if (!wasProcessing) {
								this.isProcessing = false;
							}
							return Promise.reject(e);
						}
					}

					// Reset isProcessing before changing currentStep so the new step renders with buttons enabled.
					this.isProcessing = false;

					let process = () =>
						new Promise((resolve, reject) => {
							this.highlightReady = false;
							this.customCallbacks.onPreviousStep(
								this.currentStep
							);
							this.currentStep = futureStep;
							resolve();
						});

					await process();
				} else {
					// Only reset if we activated it.
					if (!wasProcessing) {
						this.isProcessing = false;
					}
				}

				return Promise.resolve();
			} catch (error) {
				// Only reset if we activated it
				if (!wasProcessing) {
					this.isProcessing = false;
				}
				throw error;
			}
		},
		async nextStep() {
			// If isProcessing is already active, we're being called from a wrapped custom action.
			const wasProcessing = this.isProcessing;

			// Only activate isProcessing if it wasn't already active.
			if (!wasProcessing && this.customOptions.preventMultipleActions) {
				if (this.isProcessing) {
					if (this.customOptions.debug) {
						console.log(
							"[Vue Tour] nextStep blocked - already in progress"
						);
					}
					return Promise.resolve();
				}
				this.isProcessing = true;
			}

			try {
				let futureStep = this.currentStep + 1;

				if (
					futureStep < this.numberOfSteps &&
					this.currentStep !== -1
				) {
					let step = this.steps[futureStep];
					if (typeof step.before !== "undefined") {
						try {
							await step.before("next");
						} catch (e) {
							if (!wasProcessing) {
								this.isProcessing = false;
							}
							return Promise.reject(e);
						}
					}

					// Reset isProcessing before changing currentStep so the new step renders with buttons enabled.
					this.isProcessing = false;

					let process = () =>
						new Promise((resolve, reject) => {
							this.highlightReady = false;
							this.customCallbacks.onNextStep(this.currentStep);
							this.currentStep = futureStep;
							resolve();
						});

					await process();
				} else {
					// Only reset if we activated it.
					if (!wasProcessing) {
						this.isProcessing = false;
					}
				}

				return Promise.resolve();
			} catch (error) {
				// Only reset if we activated it.
				if (!wasProcessing) {
					this.isProcessing = false;
				}
				throw error;
			}
		},
		stop() {
			this.customCallbacks.onStop();
			const containerElement =
				this.customOptions.container === "body"
					? document.body
					: document.querySelector(this.customOptions.container) ||
					  document.body;
			containerElement.classList.remove("v-tour--active");
			this.currentStep = -1;
		},
		skip() {
			// If isProcessing is already active, we're being called from a wrapped custom action.
			const wasProcessing = this.isProcessing;

			// Only activate isProcessing if it wasn't already active
			if (!wasProcessing && this.customOptions.preventMultipleActions) {
				if (this.isProcessing) {
					if (this.customOptions.debug) {
						console.log(
							"[Vue Tour] skip blocked - already in progress"
						);
					}
					return;
				}
				this.isProcessing = true;
			}

			try {
				this.customCallbacks.onSkip();
				this.stop();
			} finally {
				// Only reset if we activated it.
				if (!wasProcessing) {
					this.isProcessing = false;
				}
			}
		},
		finish() {
			// If isProcessing is already active, we're being called from a wrapped custom action.
			const wasProcessing = this.isProcessing;

			// Only activate isProcessing if it wasn't already active.
			if (!wasProcessing && this.customOptions.preventMultipleActions) {
				if (this.isProcessing) {
					if (this.customOptions.debug) {
						console.log(
							"[Vue Tour] finish blocked - already in progress"
						);
					}
					return;
				}
				this.isProcessing = true;
			}

			try {
				this.customCallbacks.onFinish();
				this.stop();
			} finally {
				// Only reset if we activated it.
				if (!wasProcessing) {
					this.isProcessing = false;
				}
			}
		},

		handleNext() {
			const currentStep = this.steps[this.currentStep];
			const customAction = currentStep?.buttonNext?.action;
			if (customAction) {
				this.executeNavigationAction(customAction);
			} else {
				this.nextStep();
			}
		},
		handlePrevious() {
			const currentStep = this.steps[this.currentStep];
			const customAction = currentStep?.buttonPrevious?.action;
			if (customAction) {
				this.executeNavigationAction(customAction);
			} else {
				this.previousStep();
			}
		},
		handleSkip() {
			const currentStep = this.steps[this.currentStep];
			const customAction = currentStep?.buttonSkip?.action;
			if (customAction) {
				this.executeNavigationAction(customAction);
			} else {
				this.skip();
			}
		},
		handleFinish() {
			const currentStep = this.steps[this.currentStep];
			const customAction = currentStep?.buttonStop?.action;
			if (customAction) {
				this.executeNavigationAction(customAction);
			} else {
				this.finish();
			}
		},

		handleKeyup(e) {
			// Block keyboard navigation if an action is already in progress.
			if (this.isProcessing) {
				if (this.customOptions.debug) {
					console.log(
						"[Vue Tour] Keyboard navigation blocked - action already in progress"
					);
				}
				return;
			}

			if (this.customOptions.debug)
				console.log("[DEBUG] [Vue Tour] A keyup event occured:", e);
			const isButtonAllowed = name =>
				this.steps[this.currentStep]?.enabledButtons?.hasOwnProperty(
					name
				)
					? this.steps[this.currentStep].enabledButtons[name]
					: true;

			const currentStep = this.steps[this.currentStep];

			switch (e.keyCode) {
				case KEYS.ARROW_LEFT:
					if (
						isButtonAllowed("buttonPrevious") &&
						this.isKeyEnabled("arrowRight")
					) {
						const customAction =
							currentStep?.buttonPrevious?.action;
						if (customAction) {
							this.executeNavigationAction(customAction);
						} else {
							this.executeNavigationAction(this.previousStep);
						}
					}
					break;
				case KEYS.ARROW_RIGHT:
					if (
						isButtonAllowed("buttonNext") &&
						this.isKeyEnabled("arrowLeft")
					) {
						const customAction = currentStep?.buttonNext?.action;
						if (customAction) {
							this.executeNavigationAction(customAction);
						} else {
							this.executeNavigationAction(this.nextStep);
						}
					}
					break;
				case KEYS.ESCAPE:
					if (this.isKeyEnabled("escape")) {
						this.stop();
					}
					break;
			}
		},
		isKeyEnabled(key) {
			const { enabledNavigationKeys } = this.customOptions;
			return enabledNavigationKeys.hasOwnProperty(key)
				? enabledNavigationKeys[key]
				: true;
		}
	}
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
