import VTour from "./components/VTour.vue";
import VStep from "./components/VStep.vue";

const VueTour = {
	install(app, options) {
		if (!options) {
			options = {};
		}

		app.component(VTour.name, VTour);
		app.component(VStep.name, VStep);

		app.config.globalProperties.$tours = {};
	},
	// Export components for direct access if needed
	VTour,
	VStep
};

// Default export only
export default VueTour;
