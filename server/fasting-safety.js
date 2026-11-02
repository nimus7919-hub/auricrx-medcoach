function fastingAdvice(profile = {}, language = 'en') {
  const restricted = ['diabetes', 'pregnancy', 'breastfeeding', 'eatingDisorders', 'eating_disorders'].some(key => profile[key] === true);
  return { schedule: null, restricted, message: language === 'es'
    ? (restricted ? 'Por tu perfil, habla con tu médico antes de cualquier ayuno.' : 'Ventana de ayuno de ejemplo. Consulta a tu médico antes de ayunar.')
    : (restricted ? 'Because of your profile, talk to your doctor before any fasting.' : 'Example fasting window. Check with your doctor before fasting.') };
}
module.exports = { fastingAdvice };
