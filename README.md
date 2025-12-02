# v3-tour

> v3-tour is a lightweight, simple and customizable tour plugin for use with Vue.js.
> It provides a quick and easy way to guide your users through your application.

[![Vue Tour](./screenshot.gif "Vue Tour")](https://pulsardev.github.io/vue-tour/)

## Table of Contents

-   [Getting Started](#getting-started)
-   [Something Missing?](#something-missing)

## Getting Started

You can install `v3-tour` using npm or by downloading the minified build on GitHub.

```
npm install v3-tour
```

Then import the plugin in your application entry point (typically main.js if you used vue-cli to scaffold your project) and tell Vue to use it.
Also don't forget to include the styles. You can add the styles provided by default or customize them to your own liking.

```javascript
import Vue from "vue";
import App from "./App.vue";
import VueTour from "v3-tour";

require("v3-tour/dist/vue-tour.css");

Vue.use(VueTour);

new Vue({
	render: h => h(App)
}).$mount("#app");
```

Finally put a `v-tour` component in your template anywhere in your app (usually in App.vue) and pass it an array of steps.
The `target` property of each step can target a DOM element in any component of your app (as long as it exists in the DOM when the concerned step pops up).

```html
<template>
	<div>
		<div id="v-step-0">
			A DOM element on your page. The first step will pop on this element
			because its ID is 'v-step-0'.
		</div>
		<div class="v-step-1">
			A DOM element on your page. The second step will pop on this element
			because its ID is 'v-step-1'.
		</div>
		<div data-v-step="2">
			A DOM element on your page. The third and final step will pop on
			this element because its ID is 'v-step-2'.
		</div>
		<v-tour name="myTour" :steps="steps"></v-tour>
	</div>
</template>

<script>
	export default {
		name: "my-tour",
		data() {
			return {
				steps: [
					{
						target: "#v-step-0", // We're using document.querySelector() under the hood
						header: {
							title: "Get Started"
						},
						content: `Discover <strong>Vue Tour</strong>!`
					},
					{
						target: ".v-step-1",
						content: "An awesome plugin made with Vue.js!"
					},
					{
						target: '[data-v-step="2"]',
						content:
							"Try it, you'll love it!<br>You can put HTML in the steps and completely customize the DOM to suit your needs.",
						params: {
							placement: "top" // Any valid Popper.js placement. See https://popper.js.org/popper-documentation.html#Popper.placements
						}
					}
				]
			};
		},
		mounted: function() {
			this.$tours["myTour"].start();
		}
	};
</script>
```

For all individual elements you want to add a step on, make sure it can be retrieved with `document.querySelector()`. You can use any selector, an ID, a CSS class, data attributes, etc.
Once this is done and your steps correctly target some DOM elements of your application, you can start the tour by calling the following method.

```javascript
this.$tours["myTour"].start();
```

## Container Option

By default, Vue Tour renders the tour steps in the `body` element. You can now specify a custom container where the tour should be rendered using the `container` option:

```html
<!-- Render tour in body (default) -->
<v-tour name="myTour" :steps="steps" :options="{ container: 'body' }"></v-tour>

<!-- Render tour in a specific element -->
<v-tour
	name="myTour"
	:steps="steps"
	:options="{ container: '#my-container' }"
></v-tour>

<!-- You can use any CSS selector -->
<v-tour
	name="myTour"
	:steps="steps"
	:options="{ container: '.tour-container' }"
></v-tour>
```

This is useful when you want to constrain the tour within a specific component or container, rather than having it appear over the entire page.

For a more detailed documentation, checkout the [docs for vue-tour](https://github.com/pulsardev/vue-tour/wiki).

## `before()` UI step functions

If you need to do UI setup work before a step, there's a `before` function you may include in any/each of
your steps. This function will get invoked before the start/next/previous step is rendered. The function must return a promise. The function is invoked when `start`, `nextStep`, and `previousStep` are triggered. When the promise is rejected, it will not move to the next or previous step. If the promise is resolved then it will move in the direction specified.

It's used when you need to change what's shown on the screen between steps. For example, you may want to hide
one set of menus and open a screen or you want to perform an async operation. This is especially useful in single-page applications.

```javascript
steps: [
	{
		target: "#v-step-0", // We're using document.querySelector() under the hood
		content: `Discover <strong>Vue Tour</strong>!`,
		before: type =>
			new Promise((resolve, reject) => {
				// Time-consuming UI/async operation here
				resolve("foo");
			})
	}
];
```

### Example with async operations

```javascript
steps: [
	{
		target: "#step-1",
		content: "Click next to load data...",
		before: async type => {
			// This async operation will prevent navigation until complete
			const response = await fetch("/api/data");
			const data = await response.json();
			// Update your app state
			return data;
		}
	},
	{
		target: "#step-2",
		content: "Data loaded! The previous button was disabled during loading."
	}
];
```

## Preventing Multiple Actions

By default, v3-tour prevents users from clicking navigation buttons or using keyboard shortcuts multiple times while a navigation action is in progress. This is especially useful when you have async operations in `before()` hooks or other time-consuming operations.

### How it works

The tour component tracks an internal `isProcessing` state that gets set to `true` when a navigation action starts and resets to `false` when it completes. During this time:

-   Navigation buttons (previous, next, skip, finish) are automatically disabled
-   Keyboard navigation (arrow keys, ESC) is blocked
-   Multiple rapid clicks/keypresses are ignored

### Configuration

You can control this behavior with the `preventMultipleActions` option:

```javascript
// Enable prevention (default)
<v-tour name='myTour' :steps='steps' :options="{ preventMultipleActions: true }"></v-tour>

// Disable prevention
<v-tour name='myTour' :steps='steps' :options="{ preventMultipleActions: false }"></v-tour>
```

### Accessing the processing state

The `isProcessing` state is exposed through the tour's slot scope, allowing you to show loading indicators or disable custom UI elements:

```html
<v-tour name="myTour" :steps="steps">
	<template v-slot="tour">
		<v-step
			v-if="tour.steps[tour.currentStep]"
			:step="tour.steps[tour.currentStep]"
			:is-processing="tour.isProcessing"
			...
		>
			<!-- Custom buttons that respect the processing state -->
			<template #actions>
				<button
					@click="tour.skip"
					:disabled="tour.isProcessing"
					:loading="tour.isProcessing"
				>
					Skip Tour
				</button>
				<button
					@click="tour.nextStep"
					:disabled="tour.isProcessing"
					:loading="tour.isProcessing"
				>
					Next
				</button>
			</template>
		</v-step>
	</template>
</v-tour>
```

## Spotlight and Highlighting Features

v3-tour includes advanced spotlight and highlighting features to better guide users' attention during tours.

### `highlight` Property

Controls whether the spotlight effect is enabled for a step. When enabled, the target element is highlighted with a spotlight mask that darkens the rest of the page.

**Basic usage (Boolean):**

```javascript
steps: [
	{
		target: "#important-button",
		content: "Click here to continue",
		highlight: true // Enable spotlight with default settings
	},
	{
		target: "#secondary-element",
		content: "This is less important",
		highlight: false // No spotlight, just the tooltip
	}
];
```

**Advanced usage (Object):**

The `highlight` property can also be an object to customize the spotlight appearance and behavior:

```javascript
steps: [
	{
		target: "#custom-element",
		content: "Custom spotlight configuration",
		highlight: {
			target: ".container", // Optional: highlight different element than tooltip target
			padding: 20, // Space around target (default: 10px)
			opacity: 0.8, // Overlay darkness (default: 0.7)
			radius: 8, // Border radius (default: 12px)
			zIndex: 10000, // Z-index (default: 9998)
			editable: true, // Allow interaction (default: false)
			forceMask: false // Force full-screen mask (default: false)
		}
	}
];
```

You can set a default `highlight` value for all steps in the tour options:

```html
<v-tour name="myTour" :steps="steps" :options="{ highlight: true }"></v-tour>
```

Step-level `highlight` property overrides the global option.

### `highlight.target` Property

By default, the spotlight mask highlights the same element where the step tooltip is positioned (the `target` property). However, you might want to highlight a different area while keeping the tooltip positioned elsewhere.

The `highlight.target` property allows you to specify a different element for the spotlight mask, while the main `target` property continues to control the tooltip position.

```javascript
steps: [
	{
		target: ".submit-button", // Tooltip appears next to the button
		highlight: {
			target: ".entire-form" // But spotlight covers the entire form
		},
		content: "Fill out this form and click submit"
	},
	{
		target: ".menu-icon", // Tooltip next to menu icon
		highlight: {
			target: ".sidebar" // Spotlight covers entire sidebar
		},
		content: "Explore the sidebar options"
	}
];
```

**Use cases:**

-   Position tooltip on a small button but highlight a larger container
-   Show tooltip at the top of a modal while highlighting the entire modal
-   Guide users to a specific action while drawing attention to a broader context

If `highlight.target` is not specified, it falls back to using `target` for both the tooltip position and spotlight.

### `highlight.forceMask` Property

Forces a full-screen mask (overlay) to appear behind the step, regardless of whether a target exists. This is useful for centered steps or important announcements where you want to block interaction with the entire page.

```javascript
steps: [
	{
		target: undefined, // No specific target - step appears centered
		header: {
			title: "Welcome!"
		},
		content: "Let's take a tour of the application",
		highlight: {
			forceMask: true // Full-screen dark overlay
		},
		params: {
			placement: "center"
		}
	},
	{
		target: "#feature-panel",
		content: "Here's an important feature",
		highlight: {
			forceMask: true // Full overlay even though there's a target
		}
	}
];
```

**Behavior:**

-   When `highlight.forceMask: true`, a full-screen semi-transparent overlay covers the entire page
-   Works with or without a `target` element
-   Useful for modal-like tour steps that require full user attention
-   Default value is `false`

### `highlight.editable` Property

Controls whether the highlighted target element can be interacted with during the tour step.

```javascript
steps: [
	{
		target: "#email-input",
		content: "Enter your email address",
		highlight: {
			editable: true // User can type in the input field
		}
	},
	{
		target: "#readonly-display",
		content: "This information is for reference only",
		highlight: {
			editable: false // User cannot interact with the element (default)
		}
	}
];
```

**How it works:**

-   When `highlight.editable: false` (default), the spotlight overlay blocks interaction with elements outside the highlighted area
-   When `highlight.editable: true`, the spotlight overlay allows pointer events to pass through, enabling user interaction with the highlighted element
-   Particularly useful when you need users to perform an action (fill a form, click a button) as part of the tour

### Spotlight Customization Properties

All spotlight appearance properties are part of the `highlight` object:

```javascript
steps: [
	{
		target: "#custom-element",
		content: "Fully customized spotlight",
		highlight: {
			padding: 20, // Space around target (default: 10px)
			opacity: 0.8, // Overlay darkness, 0-1 (default: 0.7)
			radius: 8, // Border radius in pixels (default: 12px) or CSS string ("16px 8px" or "50%")
			zIndex: 10000 // Z-index value (default: 9998)
		}
	}
];
```

**Border Radius Behavior:**

The `highlight.radius` property controls the border-radius of the spotlight overlay. It has smart fallback behavior:

1. **If `highlight.radius` is defined:** Uses the provided value (number in pixels or CSS string like "16px 8px" or "50%" for complex radius)
2. **If `highlight.radius` is undefined:** Automatically inherits the border-radius from the target element's computed styles
3. **If target has no border-radius:** No border-radius is applied to the spotlight

This allows the spotlight to automatically match the shape of rounded buttons, cards, or any element with curved corners.

```javascript
steps: [
	{
		target: "#rounded-button", // Button has border-radius: 24px
		highlight: true // Spotlight will automatically use 24px border-radius
	},
	{
		target: "#card",
		highlight: {
			radius: 16 // Override with custom radius
		}
	},
	{
		target: "#input",
		highlight: {
			radius: "8px 8px 0 0" // Top corners only
		}
	},
	{
		target: "#circle",
		highlight: {
			radius: "50%" // Circular radius
		}
	}
];
```

### Complete Example

```javascript
steps: [
	{
		// Welcome step with full-screen overlay
		target: undefined,
		header: { title: "Welcome to MyApp" },
		content: "Let's explore the main features",
		highlight: {
			forceMask: true
		},
		params: { placement: "center" }
	},
	{
		// Highlight entire sidebar, tooltip on menu button
		target: ".menu-button",
		highlight: {
			target: ".sidebar",
			padding: 15,
			opacity: 0.85
		},
		content: "Access all features from here"
	},
	{
		// Let user interact with form
		target: "#name-input",
		highlight: {
			target: ".user-form",
			editable: true,
			padding: 15
		},
		content: "Enter your name to continue"
	},
	{
		// Simple step without spotlight
		target: "#next-feature",
		content: "Moving on to the next feature",
		highlight: false
	},
	{
		// Boolean highlight uses defaults
		target: "#another-feature",
		content: "This uses default spotlight settings",
		highlight: true
	}
];
```

### Migration from Previous Versions

If you were using the old property names, here's the mapping:

-   `highlightTarget` → `highlight.target`
-   `spotlightPadding` → `highlight.padding`
-   `spotlightOpacity` → `highlight.opacity`
-   `spotlightRadius` → `highlight.radius`
-   `spotlightZIndex` → `highlight.zIndex`
-   `editable` → `highlight.editable`
-   `forceMask` → `highlight.forceMask`

## Something Missing?

If you have a feature request or found a bug, [let us know](https://github.com/pulsardev/vue-tour/issues) by submitting an issue.
