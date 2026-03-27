SELECT 
    entity.name, 
    entity.dps, 
    entity.unbuffed_dps, 
    encounter_preview.fight_start, 
    encounter_preview.current_boss, 
    encounter_preview.difficulty 
FROM entity 
JOIN encounter_preview 
    ON entity.encounter_id = encounter_preview.id 
WHERE 
    entity.entity_type = 'PLAYER'
    AND encounter_preview.difficulty IS NOT NULL
    AND encounter_preview.difficulty <> ''
    AND entity.name IN (
        'Naromiix', 'Satoriix', 'Atomiix', 'Katoriix', 'Tomoriix', 'Feraliix',
        'Aedhe', 'Boreahl', 'Nawinar', 'Lekhanar', 'Knaath', 'Dynwen', 'Kadell',
        'Brunildâ', 'Lirèsa', 'Yudellia', 'Eskkol', 'Âvlora', 'Vriytra',
        'Kijyodouji', 'Luminarys', 'Katsushiika', 'Hiymeko', 'Talaxia',
        'Neïzha', 'Dhaniria', 'Danîkha', 'Aësson', 'Songjoah', 'Zukka',
        'Alavhel', 'Eirÿs', 'Eÿsa', 'Xÿrris', 'Kiersah', 'Sebadi',
        'Liduvina', 'Simzhae', 'Chalinda', 'Uriangera', 'Crisostoma',
        'Orkhanx', 'Orkhanar', 'Orkhanavalk', 'Örkhana', 'Orkhans', 'Orkhan'
    );