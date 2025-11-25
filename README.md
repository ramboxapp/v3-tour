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

## Something Missing?

If you have a feature request or found a bug, [let us know](https://github.com/pulsardev/vue-tour/issues) by submitting an issue.
