class_name MandalingoInteractable
extends Area2D

@export var word := ""
@export_multiline var context := ""
@export var location_name := "南門"

func read_entry() -> Dictionary:
	return {
		"word": word,
		"context": context,
		"location": location_name,
		"position": global_position
	}
