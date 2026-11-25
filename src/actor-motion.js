// The controller owns movement and interaction facing. This layer only
// animates the visible rig, using the same clock in the courtyard and town.
const TAU = 2 * Math.PI;
const smooth = t => t * t * (3 - 2 * t);
const response = (rate, dt) => -Math.expm1(-rate * dt);
const angleDifference = (target, current) => Math.atan2(Math.sin(target - current), Math.cos(target - current));

export function updateActorMotion(actor, { heading, time, moving, running, reducedMotion }) {
  const { root } = actor;
  const previous = actor.motion;
  const reset = !previous || time < previous.time || root.position.distanceToSquared(previous.position) > .81;
  const state = actor.motion ??= {
    position: root.position.clone(), time, walk: 0, run: 0, turn: 0,
  };
  const dt = reset ? 0 : Math.min(.05, time - state.time);
  state.time = time;
  state.dt = dt;
  state.reset = reset;
  state.position.copy(root.position);

  if (reset || reducedMotion) {
    root.rotation.y = heading;
    state.walk = moving && !reducedMotion ? 1 : 0;
    state.run = moving && running && !reducedMotion ? 1 : 0;
    state.turn = 0;
  } else {
    const difference = angleDifference(heading, root.rotation.y);
    const maxTurn = dt * (moving ? 13 : 9);
    const step = Math.min(maxTurn, Math.abs(difference) * response(moving ? 19 : 13, dt));
    root.rotation.y += Math.sign(difference) * step;
    state.walk += ((moving ? 1 : 0) - state.walk) * response(moving ? 15 : 13, dt);
    state.run += ((moving && running ? 1 : 0) - state.run) * response(9, dt);
    state.turn += (angleDifference(heading, root.rotation.y) - state.turn) * response(19, dt);
  }
  return state;
}

export const LEG = { upper: .225, lower: .195, hip: .45, ankle: .035 };
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function placeLeg(leg, knee, boot, phase, walk, run, kneel) {
  // The support foot travels back with linear progress. The other foot
  // lifts and swings through a curved arc, with a separate toe-off motion.
  const p = ((phase % TAU) + TAU) % TAU / TAU;
  const support = .58 - run * .16;
  const onGround = p < support;
  const t = onGround ? p / support : (p - support) / (1 - support);
  // A full cycle covers .66 world units at the player's movement cadence.
  const reach = .33 * support;
  const forward = (onGround ? 1 - 2 * t : -1 + 2 * smooth(t)) * reach * walk;
  const toe = onGround ? .26 * smooth(clamp((t - .72) / .28, 0, 1)) : .26 * (1 - t) - .27 * Math.sin(t * Math.PI);
  const lift = (onGround ? Math.sin(toe) * .12 : Math.sin(t * Math.PI) ** 2 * (.105 + .06 * run) + .03 * (1 - t)) * walk;
  const hip = LEG.hip - walk * (.041 + .012 * Math.cos(phase * 2));
  const drop = hip - LEG.ankle - lift;
  const length = clamp(Math.hypot(drop, forward), .03, LEG.upper + LEG.lower - .0001);
  const bend = Math.PI - Math.acos(clamp((LEG.upper ** 2 + LEG.lower ** 2 - length ** 2) / (2 * LEG.upper * LEG.lower), -1, 1));
  const thigh = -Math.atan2(forward, drop) - Math.atan2(LEG.lower * Math.sin(bend), LEG.upper + LEG.lower * Math.cos(bend));
  const upright = 1 - kneel;
  leg.position.y = hip * upright + .08 * kneel;
  leg.rotation.x = thigh * upright - kneel * Math.PI / 2;
  knee.rotation.x = bend * upright + kneel * 1.85;
  boot.rotation.x = (toe * walk - thigh - bend) * upright - kneel * .15;
}

export function animateActorGait(actor, state, { stride, time, kneel, carrying, pose }) {
  const { walk, run, turn } = state;
  const turnBias = clamp(turn, -.5, .5);
  const phase = stride * 1.24;
  const cadence = Math.cos(phase);
  actor.body.rotation.y = (cadence * .10 * walk - turnBias * .14) * (1 - kneel) * (carrying ? .4 : 1);
  actor.body.rotation.z += (-turnBias * .11 - cadence * .028 * walk) * (1 - kneel);
  actor.body.rotation.x += (.045 + .15 * run) * walk * (1 - kneel);
  actor.body.position.y += (Math.sin(time * 2.8) * .005 * (1 - walk) - walk * (.024 + .012 * Math.cos(phase * 2))) * (1 - kneel);
  actor.head.rotation.y = turnBias * .72 - actor.body.rotation.y * .45;
  actor.head.rotation.z = -actor.body.rotation.z * .34;
  placeLeg(actor.leftLeg, actor.leftKnee, actor.leftBoot, phase, walk, run, kneel);
  placeLeg(actor.rightLeg, actor.rightKnee, actor.rightBoot, phase + Math.PI, walk, run, kneel);
  if (!carrying && pose !== "drink-water") {
    if (pose === "idle" || pose === "nod") {
      actor.leftArm.rotation.x = cadence * (.29 + .14 * run) * walk;
      actor.rightArm.rotation.x = -actor.leftArm.rotation.x;
      actor.leftForearm.rotation.x = -.15 * walk - Math.max(0, -cadence) * run * .48;
      actor.rightForearm.rotation.x = -.15 * walk - Math.max(0, cadence) * run * .48;
    }
  }
}

export function settleActorGesture(actor, state, cue, immediate) {
  const joints = [actor.leftArm, actor.rightArm, actor.leftForearm, actor.rightForearm];
  const positions = [actor.bowl.position, actor.bowl.rotation];
  const transitions = state.gesture ??= joints.map(() => [0, 0]);
  const bowlPose = state.bowl ??= positions.map(() => [0, 0, 0]);
  const changed = cue !== state.cue;
  if (immediate || !state.cue) state.cueAge = .14;
  else state.cueAge = changed ? 0 : state.cueAge + state.dt;
  state.cue = cue;
  const mix = smooth(clamp(state.cueAge / .14, 0, 1));
  if (changed) {
    state.fromGesture = transitions.map(values => values.slice());
    state.fromBowl = bowlPose.map(values => values.slice());
  }
  joints.forEach(({ rotation }, i) => {
    const from = state.fromGesture[i];
    rotation.x = transitions[i][0] = from[0] + (rotation.x - from[0]) * mix;
    rotation.z = transitions[i][1] = from[1] + (rotation.z - from[1]) * mix;
  });
  positions.forEach((position, i) => {
    const from = state.fromBowl[i];
    for (const [index, axis] of ["x", "y", "z"].entries()) {
      position[axis] = bowlPose[i][index] = from[index] + (position[axis] - from[index]) * mix;
    }
  });
}
