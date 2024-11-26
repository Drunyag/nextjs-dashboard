
// Helper function to update formData if a field is missing
export const ensureFormDataField = (
    key,
    formData,
    prevValues
) => {
    if (!formData.get(key) && prevValues[key]) {
        formData.set(key, prevValues[key]);
    }
};
