import { shallowMount } from "@vue/test-utils";
import VStep from "@/components/VStep.vue";
import { DEFAULT_OPTIONS } from "@/shared/constants";

describe("VStep.vue", () => {
	it("renders props.step.content", () => {
		const step = {
			target: "#v-step-0",
			content: "This is a demo step!"
		};

		const wrapper = shallowMount(VStep, {
			propsData: {
				step,
				stop: () => {},
				nextStep: () => {},
				labels: DEFAULT_OPTIONS.labels
			}
		});

		expect(wrapper.text()).toContain(step.content);
	});

	it("uses default container (body)", () => {
		const step = {
			target: "#test-element",
			content: "This is a demo step!"
		};

		const wrapper = shallowMount(VStep, {
			propsData: {
				step,
				stop: () => {},
				nextStep: () => {},
				labels: DEFAULT_OPTIONS.labels,
				container: "body"
			}
		});

		expect(wrapper.vm.getContainerElement()).toBe(document.body);
	});

	it("uses custom container when provided", () => {
		// Create a test container element
		const testContainer = document.createElement("div");
		testContainer.id = "test-container";
		document.body.appendChild(testContainer);

		const step = {
			target: "#test-element",
			content: "This is a demo step!"
		};

		const wrapper = shallowMount(VStep, {
			propsData: {
				step,
				stop: () => {},
				nextStep: () => {},
				labels: DEFAULT_OPTIONS.labels,
				container: "#test-container"
			}
		});

		expect(wrapper.vm.getContainerElement()).toBe(testContainer);

		// Cleanup
		document.body.removeChild(testContainer);
	});

	it("falls back to body if custom container not found", () => {
		// Mock console.warn to suppress expected warning in test
		const originalWarn = console.warn;
		console.warn = jest.fn();

		const step = {
			target: "#test-element",
			content: "This is a demo step!"
		};

		const wrapper = shallowMount(VStep, {
			propsData: {
				step,
				stop: () => {},
				nextStep: () => {},
				labels: DEFAULT_OPTIONS.labels,
				container: "#non-existent-container"
			}
		});

		expect(wrapper.vm.getContainerElement()).toBe(document.body);
		expect(console.warn).toHaveBeenCalledWith(
			'[Vue Tour] Container "#non-existent-container" not found, falling back to body'
		);

		// Restore console.warn
		console.warn = originalWarn;
	});
});
