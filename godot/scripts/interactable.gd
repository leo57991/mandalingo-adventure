class_name MandalingoInteractable
extends Area2D

@export var word := ""
@export_multiline var context := ""
@export var display_line := ""
@export var location_name := "South Gate"
@export var sequence_words := PackedStringArray()
@export var sequence_contexts := PackedStringArray()
@export var sequence_lines := PackedStringArray()

var sequence_index := 0

func read_entry() -> Dictionary:
	var active_word := word
	var active_context := context
	var active_line := display_line if not display_line.is_empty() else word
	if not sequence_words.is_empty():
		var index := mini(sequence_index, sequence_words.size() - 1)
		active_word = sequence_words[index]
		if index < sequence_contexts.size():
			active_context = sequence_contexts[index]
		if index < sequence_lines.size():
			active_line = sequence_lines[index]
		sequence_index = mini(sequence_index + 1, sequence_words.size() - 1)
	return {
		"word": active_word,
		"context": active_context,
		"line": active_line,
		"location": location_name,
		"position": global_position
	}
