function issue(issueId, type, severity, expected, actual, suggestedFixes, extra = {}) {
  return {
    issueId,
    materialId: 'MAT-CONCRETE-0001',
    type,
    severity,
    expected,
    actual,
    status: 'open',
    suggestedFixes,
    ...extra,
  };
}

export function validateMaterial(card, state, runtime) {
  const issues = [];
  if (!card.id) issues.push(issue('MATISS-0000', 'missing_material_id', 'critical', 'Stable material ID', 'No material ID is present', ['Assign a stable MAT-* identifier.']));
  if (!card.provenance || !card.provenance.creator) issues.push(issue('MATISS-0001', 'missing_provenance', 'critical', 'Creator and provenance record', 'Provenance is incomplete', ['Record the source creator and capture method.']));
  if (!card.license) issues.push(issue('MATISS-0002', 'missing_license', 'critical', 'Explicit asset license', 'No license recorded', ['Record the actual license before public reuse.']));
  if (card.provenance?.licenseStatus === 'pending_user_confirmation' || card.license === 'provisional_user_authored') issues.push(issue('MATISS-0014', 'license_confirmation_pending', 'warning', 'Confirmed public asset license', 'The source license is provisional and awaits owner confirmation', ['Confirm the intended public license before distributing the source package.']));
  if (card.normalMap === null) issues.push(issue('MATISS-0003', 'missing_normal_map', 'info', 'Authored normal map or an explicit estimate', 'No authored normal map; runtime estimate is active', ['Replace the estimate with a scanned or authored normal map when available.']));
  if (card.roughnessMap === null) issues.push(issue('MATISS-0004', 'missing_roughness_map', 'info', 'Authored roughness map or an explicit estimate', 'No authored roughness map; runtime estimate is active', ['Replace the estimate with measured roughness data when available.']));
  if (state.sourceWidth <= 0 || state.sourceHeight <= 0) issues.push(issue('MATISS-0005', 'invalid_real_world_scale', 'critical', 'Positive source dimensions in meters', `${state.sourceWidth}m × ${state.sourceHeight}m`, ['Enter the photographed area in meters.']));
  if (!card.physicalScaleValidated) issues.push(issue('MATISS-0006', 'unverified_physical_scale', 'warning', 'Measured source dimensions', 'Scale is provisional and unverified', ['Add a ruler, shoe, brick, or other known reference to the source photograph.']));
  if (card.seamless === false && runtime.repeatX > 1.5) issues.push(issue('MATISS-0007', 'visible_repetition', 'warning', 'No dominant repeated feature on a large surface', `Source is non-seamless and repeats ${runtime.repeatX.toFixed(2)}× horizontally`, ['Add macro variation, multiple crops, or seamless processing.'], { testGeometry: state.geometry }));
  if (state.geometry === 'large-plane' && runtime.repeatX > 5) issues.push(issue('MATISS-0008', 'large_surface_repetition', 'warning', 'Large-plane test remains visually varied', `Large-plane repeat is ${runtime.repeatX.toFixed(2)}×`, ['Enable anti-tiling, add macro variation, or use multiple source regions.'], { testGeometry: 'large_plane' }));
  if (!state.antiTiling) issues.push(issue('MATISS-0009', 'anti_tiling_disabled', 'info', 'Stable anti-tiling option evaluated', 'Anti-tiling is currently disabled', ['Enable the experimental deterministic macro variation for large surfaces.']));
  if (state.channel === 'final' && runtime.activeMapEstimate) issues.push(issue('MATISS-0010', 'estimated_channel_active', 'info', 'Known map provenance is visible', 'Final shading uses estimated normal/roughness channels', ['Treat close-up approval as pending until authored maps replace estimates.']));
  if (state.camera === 'close-up' && !card.closeupValidated) issues.push(issue('MATISS-0011', 'closeup_not_validated', 'warning', 'Close-up material approval', 'Close-up use is not validated', ['Inspect the surface under grazing light and compare against the source.']));
  if (state.geometry === 'sphere' && !card.curvedSurfaceValidated) issues.push(issue('MATISS-0012', 'curved_surface_not_validated', 'warning', 'Curved surface approval', 'Curved surface use is not validated', ['Check stretching and switch to a world-space projection when needed.']));
  if (state.geometry === 'wall' && !card.verticalSurfaceValidated) issues.push(issue('MATISS-0013', 'vertical_surface_not_validated', 'info', 'Vertical surface approval', 'Vertical surface use is not validated', ['Validate scale and lighting on the wall test.']));
  if (card.category === 'wood' && state.mapping !== 'triplanar') issues.push(issue('MATISS-0015', 'directional_mapping_not_validated', 'warning', 'Directional grain remains aligned on the target geometry', `Wood is currently using ${state.mapping} mapping; triplanar or world-space grain validation is still pending`, ['Add a directional/world-space mapping test before using this card on arbitrary geometry.']));

  issues.forEach((item) => { item.materialId = card.id; });
  const warningCount = issues.filter((item) => item.severity === 'warning' || item.severity === 'critical').length;
  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    materialId: card.id,
    status: warningCount ? 'validation_required' : 'prototype',
    testedGeometry: state.geometry,
    testedLighting: state.lighting,
    testedCamera: state.camera,
    testedChannel: state.channel,
    metrics: {
      repeatX: runtime.repeatX,
      repeatY: runtime.repeatY,
      sourceWidthMeters: state.sourceWidth,
      sourceHeightMeters: state.sourceHeight,
      textureResolution: 2048,
      estimatedMapChannels: ['normal', 'roughness', 'height'],
    },
    issues,
    knownLimitations: [
      'The source dimensions are provisional until a scale reference is supplied.',
      'Normal, roughness, and height channels are runtime estimates derived from the base-color photo.',
      'The source crop is not seamless; large-plane repetition is intentionally exposed.',
      'Triplanar and stochastic sampling are recorded as supported targets but are not yet active in this slice.',
    ],
  };
}
