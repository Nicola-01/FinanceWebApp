package dev.busato.FinanceWebApp.backend.mappers;

import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.model.Tag;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class TagMapper {

    public TagResponse mapToResponse(Tag tag) {
        return TagResponse.builder()
                .name(tag.getName())
                .icon(tag.getIcon())
                .colorHex(tag.getColorHex())
                .parentName(Optional.ofNullable(tag.getParent())
                        .map(Tag::getName)
                        .orElse(null))
                .build();
    }
}
