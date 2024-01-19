#version 410 core

in vec3 fNormal;
in vec4 fPosEye;
in vec2 fTexCoords;

in vec4 fragPosLightSpace;

out vec4 fColor;


//lighting
uniform	vec3 lightDir;
uniform	vec3 lightColor;

//texture
uniform sampler2D diffuseTexture;
uniform sampler2D specularTexture;

//shadow map
uniform sampler2D shadowMap;

//skybox
uniform samplerCube skybox;

//activate the fog
uniform bool fog;

vec3 ambient;
float ambientStrength = 0.2f;
vec3 diffuse;
vec3 specular;
float specularStrength = 0.5f;
float shininess = 32.0f;

float shadow;

void computeLightComponents()
{		
	vec3 cameraPosEye = vec3(0.0f);//in eye coordinates, the viewer is situated at the origin
	
	//transform normal
	vec3 normalEye = normalize(fNormal);	
	
	//compute light direction
	vec3 lightDirN = normalize(lightDir);
	
	//compute view direction 
	vec3 viewDirN = normalize(cameraPosEye - fPosEye.xyz);
		
	//compute ambient light
	ambient = ambientStrength * lightColor;
	
	//compute diffuse light
	diffuse = max(dot(normalEye, lightDirN), 0.0f) * lightColor;
	
	//compute specular light
	vec3 reflection = reflect(-lightDirN, normalEye);
	float specCoeff = pow(max(dot(viewDirN, reflection), 0.0f), shininess);
	specular = specularStrength * specCoeff * lightColor;
}


float computeShadow() 
{
	float bias = 0.005f;
	//perform perspective divide
	vec3 normalizedCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;

	normalizedCoords = normalizedCoords * 0.5 + 0.5;
	float closestDepth = texture(shadowMap, normalizedCoords.xy).r;
	
	if (normalizedCoords.z > 1.0f)
		return 0.0f;

	float currentDepth = normalizedCoords.z;

	//check if current pos in shadow
	return (currentDepth - bias) > closestDepth ? 1.0 : 0.0;
}

float computeFog() 
{
 float fogDensity = 0.012f;
 float fragmentDistance = length(fPosEye);
 float fogFactor = exp(-pow(fragmentDistance * fogDensity, 2));
 return clamp(fogFactor, 0.0f, 1.0f);
}

void main() 
{
	computeLightComponents();
	
	vec3 baseColor = vec3(0.9f, 0.35f, 0.0f);//orange
	
	ambient *= texture(diffuseTexture, fTexCoords).rgb;
	diffuse *= texture(diffuseTexture, fTexCoords).rgb;
	specular *= texture(specularTexture, fTexCoords).rgb;

	//vec3 color = min((ambient + diffuse) + specular, 1.0f);

	//modulate with shadow
	shadow = computeShadow();
	vec3 color = min((ambient + (1.0f - shadow)*diffuse) + (1.0f - shadow)*specular, 1.0f);

	vec3 cameraPosEye = vec3(0.0f);
	vec3 viewDirection = fPosEye.xyz - cameraPosEye;
	viewDirection = normalize(viewDirection);
	vec3 normalN = normalize(fNormal);
	vec3 reflection = reflect(viewDirection, normalN);
	//fColor = vec4(vec3(texture(skybox, reflection)), 1.0f); 
   
	fColor = vec4(color, 1.0f);
	float fogFactor = computeFog();
	vec4 fogColor = vec4(0.5f, 0.5f, 0.5f, 1.0f);

	if (fog ) {
		fColor = mix(fogColor, fColor, fogFactor);
		fColor = fogColor * (1 - fogFactor) + fColor * fogFactor;
    	}
 	else {
   		fColor = vec4(color, 1.0f);

	}
}
