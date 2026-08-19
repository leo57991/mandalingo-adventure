class_name MandalingoPlayer
extends CharacterBody2D

signal interact_requested(from_position: Vector2)

@export var walk_speed := 145.0
@export var run_speed := 235.0

func _physics_process(_delta: float) -> void:
	var input_vector := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	var is_running := Input.is_physical_key_pressed(KEY_SHIFT) and input_vector.length_squared() > 0.01
	var movement_speed := run_speed if is_running else walk_speed
	velocity = input_vector * movement_speed
	move_and_slide()
	if input_vector.x != 0.0:
		$Sprite2D.flip_h = input_vector.x < 0.0
	if input_vector.length_squared() > 0.01:
		var stride_rate := 0.019 if is_running else 0.012
		var stride_sway := 0.02 if is_running else 0.012
		$Sprite2D.rotation = sin(Time.get_ticks_msec() * stride_rate) * stride_sway
	else:
		$Sprite2D.rotation = lerp($Sprite2D.rotation, 0.0, 0.2)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact"):
		interact_requested.emit(global_position)
