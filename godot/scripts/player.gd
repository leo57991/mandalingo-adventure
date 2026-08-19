class_name MandalingoPlayer
extends CharacterBody2D

signal interact_requested(from_position: Vector2)

@export var walk_speed := 145.0

func _physics_process(_delta: float) -> void:
	var input_vector := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	velocity = input_vector * walk_speed
	move_and_slide()
	if input_vector.x != 0.0:
		$Sprite2D.flip_h = input_vector.x < 0.0
	if input_vector.length_squared() > 0.01:
		$Sprite2D.rotation = sin(Time.get_ticks_msec() * 0.012) * 0.012
	else:
		$Sprite2D.rotation = lerp($Sprite2D.rotation, 0.0, 0.2)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact"):
		interact_requested.emit(global_position)
