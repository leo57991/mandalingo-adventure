extends Node2D

const INTERACT_DISTANCE := 175.0

@onready var player: MandalingoPlayer = $World/Objects/Player
@onready var dialogue_panel: PanelContainer = $UI/DialoguePanel
@onready var dialogue_text: Label = $UI/DialoguePanel/Margin/DialogueText
@onready var notebook_panel: PanelContainer = $UI/NotebookPanel
@onready var notebook_text: RichTextLabel = $UI/NotebookPanel/Margin/VBox/NotebookText
@onready var guess_input: LineEdit = $UI/NotebookPanel/Margin/VBox/GuessRow/GuessInput
@onready var save_guess_button: Button = $UI/NotebookPanel/Margin/VBox/GuessRow/SaveGuess
@onready var hint: Label = $UI/Hint

var notebook: Dictionary = {}
var last_word := ""

func _ready() -> void:
	player.interact_requested.connect(_on_interact_requested)
	save_guess_button.pressed.connect(_save_guess)
	guess_input.text_submitted.connect(_save_guess)
	dialogue_panel.hide()
	notebook_panel.hide()
	hint.text = "WASD 移動　E 觀察／交談　N 筆記本"

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("notebook"):
		notebook_panel.visible = not notebook_panel.visible
		dialogue_panel.hide()
		_refresh_notebook()
	if event.is_action_pressed("debug_collisions"):
		get_tree().debug_collisions_hint = not get_tree().debug_collisions_hint

func _on_interact_requested(from_position: Vector2) -> void:
	var nearest: MandalingoInteractable
	var nearest_distance := INF
	for candidate in get_tree().get_nodes_in_group("interactable"):
		if candidate is MandalingoInteractable:
			var distance := from_position.distance_to(candidate.global_position)
			if distance < INTERACT_DISTANCE and distance < nearest_distance:
				nearest = candidate
				nearest_distance = distance
	if nearest == null:
		dialogue_text.text = "附近沒有可觀察的事物。"
	else:
		_record_entry(nearest.read_entry())
	dialogue_panel.show()

func _record_entry(entry: Dictionary) -> void:
	var word: String = entry.word
	if not notebook.has(word):
		notebook[word] = {"count": 0, "location": "", "guess": "（尚未猜測）"}
	notebook[word]["count"] += 1
	notebook[word]["location"] = entry.location
	last_word = word
	dialogue_text.text = entry.context + "\n\n[ 已記入筆記：" + word + " ]"
	_refresh_notebook()

func _save_guess(_submitted_text := "") -> void:
	var guess := guess_input.text.strip_edges()
	if last_word.is_empty() or guess.is_empty():
		return
	notebook[last_word]["guess"] = guess
	guess_input.clear()
	_refresh_notebook()

func _refresh_notebook() -> void:
	if notebook.is_empty():
		notebook_text.text = "[font_size=24]旅人筆記[/font_size]\n\n尚未記下任何詞語。去觀察石碑或與守門人交談。"
		return
	var lines := "[font_size=24]旅人筆記[/font_size]\n[color=#9fb3a6]不立即判定正誤；先留下你的理解。[/color]\n\n"
	for word in notebook:
		var entry: Dictionary = notebook[word]
		lines += "[font_size=28][color=#edcf8b]" + word + "[/color][/font_size]\n"
		lines += "出現：" + str(entry["count"]) + " 次　最後地點：" + entry["location"] + "\n"
		lines += "英文猜測：" + entry["guess"] + "\n\n"
	notebook_text.text = lines
