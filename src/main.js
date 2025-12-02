import VTour from "./components/VTour.vue";
import VStep from "./components/VStep.vue";
import VSpotlightMask from "./components/VSpotlightMask.vue";

const VueTour = {
	install(app, options) {
		if (!options) {
			options = {};
		}

		app.component(VTour.name, VTour);
		app.component(VStep.name, VStep);
		app.component(VSpotlightMask.name, VSpotlightMask);

		app.config.globalProperties.$tours = {};
	},
	// Export components for direct access if needed
	VTour,
	VStep,
	VSpotlightMask
};

// Default export only
export default VueTour;
