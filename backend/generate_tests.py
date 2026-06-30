import os

base_path = "/home/nicola/Desktop/FinanceWebApp/backend/src/test/java/dev/busato/FinanceWebApp/backend"

mappers_path = os.path.join(base_path, "mappers")
os.makedirs(mappers_path, exist_ok=True)

repos_path = os.path.join(base_path, "repository")
os.makedirs(repos_path, exist_ok=True)

mappers_src = "/home/nicola/Desktop/FinanceWebApp/backend/src/main/java/dev/busato/FinanceWebApp/backend/mappers"
for mapper_file in os.listdir(mappers_src):
    if mapper_file.endswith("Mapper.java"):
        mapper_name = mapper_file.replace(".java", "")
        test_file = os.path.join(mappers_path, mapper_name + "Test.java")
        with open(test_file, 'w') as f:
            f.write(f"""package dev.busato.FinanceWebApp.backend.mappers;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
class {mapper_name}Test {{

    @Autowired
    private {mapper_name} mapper;

    @Test
    void testMapperLoads() {{
        assertNotNull(mapper, "Mapper should be loaded into the Spring context");
    }}
}}
""")

with open(os.path.join(repos_path, "RegistrationsRepositoryTest.java"), 'w') as f:
    f.write("""package dev.busato.FinanceWebApp.backend.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@DataJpaTest
@ActiveProfiles("test")
class RegistrationsRepositoryTest {

    @Autowired
    private RegistrationsRepository repository;

    @Test
    void testRepositoryLoads() {
        assertNotNull(repository);
    }
}
""")

